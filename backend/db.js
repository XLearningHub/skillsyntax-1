/*const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "skill_syntax"
});

connection.connect((err) => {
  if (err) {
    console.error("Error de conexión:", err);
  } else {
    console.log("Conectado a MySQL 🚀");
  }
});

module.exports = connection;*/

require("dotenv").config();

const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error("Error de conexión:", err);
  } else {
    console.log("Conectado a MySQL 🚀");
  }
});

module.exports = connection;