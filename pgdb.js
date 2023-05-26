require('dotenv').config();
const { Client } = require('pg');

async function createDatabase() {
  const client = new Client({
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD
  });

  try {
    await client.connect();
    const checkDatabaseExist = `SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower('${process.env.DATABASE}')`;
    const { rows } = await client.query(checkDatabaseExist);

    if (rows.length === 0) {
      await client.query(`CREATE DATABASE ${process.env.DATABASE}`);
      console.log('database created');
    } else {
      console.log('database exists');
    }

    await client.query(`ALTER DATABASE ${process.env.DATABASE} OWNER TO ${process.env.USER}`);

    await client.end();

    const databaseClient = new Client({
      host: process.env.HOST,
      port: process.env.PORT,
      user: process.env.USER,
      password: process.env.PASSWORD,
      database: process.env.DATABASE
    });

    await databaseClient.connect();

    const createTables = [
      `CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        date INTEGER NOT NULL,
        summary VARCHAR(255) NOT NULL,
        body VARCHAR(225) NOT NULL,
        recommend BOOLEAN NOT NULL,
        reported BOOLEAN NOT NULL,
        reviewer_name VARCHAR(255) NOT NULL,
        reviewer_email VARCHAR(255) NOT NULL,
        response VARCHAR(255) DEFAULT NULL,
        helpfulness INTEGER
      )`
    ];

    for (const table of createTables) {
      await databaseClient.query(table);
      console.log(`${table} created`)
    }

    await databaseClient.end();
  } catch (error) {
    console.error('error', error);
  }
  }

  createDatabase().catch(console.error);
