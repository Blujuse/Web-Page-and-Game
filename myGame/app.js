const express = require('express');
const path = require('node:path');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

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
//Login Function
//
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

app.post('/login', (req, res) => {
  const {username, userPassword} = req.body;
  loginUser(username, userPassword, res);
});

//
// Page Linking Stuff
//
app.get('/registerPage', function(req,res){
  res.sendFile(__dirname + '/static/register.html');
});

app.get('/loginPage', function(req,res){
  res.sendFile(__dirname + '/static/login.html');
});

app.get('*', function(req,res){
  res.status(404).sendFile(__dirname + '/static/404page.html');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})