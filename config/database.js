const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  host: process.env.DB2_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB2_PASSWORD,
  database: process.env.DB2_NAME,
  multipleStatements: true,
};
