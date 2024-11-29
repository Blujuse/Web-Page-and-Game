const express = require('express');
const path = require('node:path');
const app = express();
const port = 3000;

var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cmp5360"
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

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/some', (req, res) => {
    res.send('Change a word!')
  })

  app.get('/test', (req, res) => {
    res.send('This is test page')
  })

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})