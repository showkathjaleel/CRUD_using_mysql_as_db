const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors=require('cors')
const axios=require('axios')
const iconv = require('iconv-lite');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// parse application/json
app.use(bodyParser.json());

//create database connection
const pool = mysql.createConnection({
  host: 'localhost',
  user: 'showkath',
  password: 'Show@#29',
  database: 'mydatabase',
  insecureAuth: true
});

// connect to database
pool.connect((err) =>{
  if(err) throw err;
  console.log('Mysql Connected...');
});

axios.get('https://api.publicapis.org/entries')
  .then(response => {
    var jsonData = response.data.entries;
    console.log(jsonData);


// Creating SQL query string
const sql = 'CREATE TABLE IF NOT EXISTS api_data (id INT AUTO_INCREMENT PRIMARY KEY, API VARCHAR(255), Description TEXT, Auth VARCHAR(255), HTTPS BOOLEAN, Cors VARCHAR(255), Link VARCHAR(255), Category VARCHAR(255))';

// Executing SQL query
pool.query(sql, (err, result) => {
  if (err) throw err;
  console.log('Table created successfully!');
});

// Loop through each entry and insert into the MySQL table
jsonData.forEach(entry => {
  // Encoding special characters using iconv-lite
  const description = iconv.encode(entry.Description, 'win1252').toString();

  const sql = 'INSERT IGNORE INTO api_data (API, Description, Auth, HTTPS, Cors, Link, Category) VALUES (?, ?, ?, ?, ?, ?, ?)';

  pool.query(sql, [entry.API, description, entry.Auth, entry.HTTPS, entry.Cors, entry.Link, entry.Category], (err, result) => {
    if (err) throw err;
    console.log(`Data inserted for ${entry.API} successfully!`);
  });
});
})
.catch(error => {
console.log(error);
});


app.get('/api_data', (req, res) => {
pool.query('SELECT * FROM api_data', (err, result) => {
  if (err) return res.json({ status: 'error', message: err.message });
  return res.json({ status: 'success', data: result });
});
});




app.get('/api_data/:api', (req, res) => {
const api = req.params.api;
pool.query('SELECT * FROM api_data WHERE API = ?', [api], (err, result) => {
if (err) return res.json({ status: 'error', message: err.message });
if (result.length === 0) return res.json({ status: 'error', message: 'No record found for this ID!' });
return res.json({ status: 'success', data: result[0 ] });
});
});


app.put('/api_data/:api', async (req, res) => {
try {
const { API, Description, Auth, HTTPS, Cors, Link, Category } = req.body;
const result = await pool.query('UPDATE api_data SET API = ?, Description = ?, Auth = ?, HTTPS = ?, Cors = ?, Link = ?, Category = ? WHERE API = ?', [API, Description, Auth, HTTPS, Cors, Link, Category, req.params.api]);
if (result[0].affectedRows === 0) {
  return res.status(404).send('Entry not found');
}
res.send('Entry updated');
} catch (err) {
console.error(err);
res.status(500).send('Server error');
}
});

// Delete existing entry
app.delete('/api/:id', async (req, res) => {
try {
const [result] = await pool.query('DELETE FROM api_data WHERE API = ?', [req.params.id]);
if (result.affectedRows === 0) return res.status(404).send('Entry not found');
res.send('Entry deleted');
} catch (err) {
console.error(err);
res.status(500).send('Server error');
}
});



//start server
app.listen(5000,() =>{
  console.log('Server started on port 3000...');
});