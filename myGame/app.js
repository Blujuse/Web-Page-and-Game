// Server Stuff
const express = require('express');
const path = require('node:path');
const app = express();
const port = 3000;

// Password Encryption
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

// Remain Logged In Stuff
const session = require('express-session');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const LOGIN_KEY = 'tempKey';


var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "webgamedatabase"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  con.query("SELECT * FROM user", function (err, result, fields) {
    if (err) throw err;
    console.log(result);
  });
});

app.use(express.static(path.join(__dirname, 'static')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//
// Register Function
//
function registerUser(Username, Password, res) 
{
  const saltRounds = 10;
  const score = 0;
  console.log("1")
  bcrypt.hash(Password, saltRounds, (err, hashedPassword) => {
    
    if (err)
    {
      //if this is called, this means that there was an error with hashing the password
      console.error("Error hashing the password: ", err);
      return res.status(404).send('1');
    };

    const query = 'INSERT INTO user (username, password, score) VALUES (?, ?, ?)';

    con.query(query, [Username, hashedPassword, score], (err, results) => {
      if (err) 
      {
        //this is called when there is an error inputing the user
        console.error("Error inserting user: ", err);
        return res.status(404).send('2');
      };
      console.log('User registered successfully: ', results);
      res.redirect('/registerPage');
    });
  });
};

app.post('/register', (req, res) => {
  console.log("log")
  const { username, userPassword } = req.body;
  console.log("0")
  registerUser(username, userPassword, res);
  console.log("123")
});

//
// Login Function
//
app.use(cookieParser());
app.use(session({
  secret: LOGIN_KEY,
  resave: false,
  saveUninitialized:true,
  cookie: { secure: false } // Will be true if using secure webpage (https)
}));

function loginUser(Username, Password, res)
{
  console.log('Attempting to login with username: ', Username);  // Added log for username
  const query = 'SELECT * FROM user WHERE username = ?';  // Check if your column is named 'username'
  
  con.query(query, [Username], (err, results) => {
    if (err) 
    {
      console.error('Error fetching user:', err);
      return res.status(404).send('Login failed due to fetching error.');
    }
    
    if (results.length > 0)
    {
      const user = results[0];
      console.log('User found in database:', user);  // Added log to see user data

      bcrypt.compare(Password, user.password, (err, isMatch) => {
        if (err)
        {
          console.error('Error comparing passwords:', err);
          return res.status(404).send('Login failed due to password comparison error.');
        }

        if (isMatch)
        {
          console.log('Login successful:', user);

          // Generate JWT token for logged in user
          const token = jwt.sign({ username: user.username }, LOGIN_KEY, { expiresIn: '1h' });

          // Create cookie with token to keep user signed in
          res.cookie('authToken', token, { httpOnly: true });

          return res.redirect('/loginPage');
        }

        console.log('Password mismatch');  // Added log if passwords don't match
        res.status(404).send('Invalid username or password.');
      });
    }
    else
    {
      console.log('User not found in database');  // Added log if user not found
      res.status(404).send('Invalid username or password.');
    }
  });
}

// Basically validates user login token
function authenticate(req, res, next) 
{
  const token = req.cookies.authToken; // Retrieves token from users cookies, generated during login, and stored in browser

  // If there is no token returns 401, telling the user to login
  if (!token) 
  {
    return res.status(401).send('Unauthorized. Please log in.');
  }

  // Uses jwt.verify method to check if token is valid, LOGIN_KEY is used to sign the token during login
  jwt.verify(token, LOGIN_KEY, (err, decoded) => {
    // If verification fails return 403
    if (err) 
    {
      return res.status(403).send('Invalid token.');
    }

    req.user = decoded; // if the token is valid then it is stored in req.user

    next(); // Function used to pass control to next handler
  });
}

app.post('/login', (req, res) => {
  const {username, userPassword} = req.body;
  loginUser(username, userPassword, res);
});

//
// Score Functions
//
function sendHighScoreToServer(Username, Score, res) 
{
  console.log(`Updating high score for user: ${Username}`); // Says what user it will update the score for
  
  const query = 'UPDATE user SET score = ? WHERE username = ? AND score < ?'; // Updates the score for current username only if it is less than current database entry

  // First 'Score' used to update, second 'Score' used to ensure table update only happens if the new score is higher than current one in the table
  con.query(query, [Score, Username, Score], (err, results) => {
    if (err) // If doesn't work send error message
    {
      console.error('Error updating high score:', err);
      return res.status(500).send('Failed to update high score.');
    }

    // Check if score was updated
    if (results.affectedRows > 0) 
    {
      console.log('High score updated successfully:', results); // If it was what to?
      res.status(200).send('High score updated.');
    } 
    else 
    {
      console.log('No update made, score is not higher.'); // If it isn't why?
      res.status(200).send('Score not high enough to update.');
    }
  });
}

// Ensures only authenticated users can submit scores to server
app.post('/submitHighScore', authenticate, (req, res) => {
  const { score } = req.body; // Pulls score from post request
  const username = req.user.username;  // Extract username from cookie JWT
  
  // Prevents invalid or bad data going to server
  if (!score) 
  {
    return res.status(400).send('Invalid data.');
  }

  sendHighScoreToServer(username, score, res); // Calls the function to upadte the users high score in database
});

// Route to Get Logged-in User Info
app.get('/getUserInfo', authenticate, (req, res) => {
  const username = req.user.username;  // From JWT
  const query = 'SELECT username, score FROM user WHERE username = ?';

  con.query(query, [username], (err, results) => {
      if (err) {
          return res.status(500).send('Error fetching user info.');
      }
      if (results.length > 0) {
          res.json(results[0]);  // Send back user data
      } else {
          res.status(404).send('User not found.');
      }
  });
});

//
// Page Linking Stuff
//
app.get('/registerPage', function(req,res){
  res.sendFile(__dirname + '/static/login.html');
});

app.get('/loginPage', function(req,res){
  res.sendFile(__dirname + '/static/index.html');
});

app.get('*', function(req,res){
  res.status(404).sendFile(__dirname + '/static/404page.html');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})