const mysql = require('mysql2/promise');

async function tryConnect() {
  const passwords = ['', 'root', '1234', 'password', 'admin', 'mysql', '12345', '123456', 'Root@123', 'root123', 'Root123'];
  
  for (const pw of passwords) {
    try {
      const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: pw,
        connectTimeout: 3000
      });
      console.log('SUCCESS! Password is: "' + pw + '"');
      await conn.end();
      return pw;
    } catch (err) {
      if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log('WRONG password: "' + pw + '"');
      } else {
        console.log('ERROR with "' + pw + '": ' + err.code + ' - ' + err.message);
        if (err.code === 'ECONNREFUSED') {
          console.log('\n*** MySQL server is NOT running! Please start MySQL first. ***');
          process.exit(1);
        }
      }
    }
  }
  console.log('\nNone of the common passwords worked.');
  console.log('Please tell me your MySQL root password.');
}

tryConnect();
