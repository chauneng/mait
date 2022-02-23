const dotenv = require('dotenv');

dotenv.config();

// module.exports = {
//   host: '127.0.0.1',
//   port: '3306',
//   user: 'root',
//   password: process.env.DB_PASSWORD,
//   database: 'test',
// };

module.exports = {
  host: 'emit.chjtdqatvvwb.ap-northeast-2.rds.amazonaws.com',
  port: '3306',
  user: 'admin',
  password: '12345',
  database: 'emit',
  multipleStatements: true,
};
