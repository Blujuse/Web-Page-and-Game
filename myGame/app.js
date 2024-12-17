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

//register function
function registerUser(Username, Password, res) {
  const saltRounds = 10;
  const score = 0;
  console.log("1")
  bcrypt.hash(Password, saltRounds, (err, hashedPassword)=>{
    if (err){
      //if this is called, this means that there was an error with hashing the password
      console.error("Error hashing the password: ", err);
      return res.status(404).send('1');
    };
    const query = 'INSERT INTO user (username, password, score) VALUES (?, ?, ?)';
    con.query(query, [Username, hashedPassword, score], (err, results)=>{
      if (err) {
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
  const { username, passW } = req.body;
  console.log("0")
  registerUser(username, passW, res);
  console.log("123")
});

app.post('/login', (req, res) => {
  const {Username, Password} = req.body;
  //add login function here
});

app.get('/registerPage', function(req,res){
  res.sendFile(__dirname + '/static/register.html');
});

app.get('*', function(req,res){
  res.status(404).sendFile(__dirname + '/static/404page.html');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})