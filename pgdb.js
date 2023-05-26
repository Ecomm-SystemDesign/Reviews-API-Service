require('dotenv').config();
const { Client, Pool } = require('pg');
const fs = require('fs');
const readline = require('node:readline');
const path = require('path');

async function createDatabase() {
  const client = new Client({
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD
  });

  const pool = new Pool({
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
  });

    const createCounterTable = `
    CREATE TABLE IF NOT EXISTS counter (
      table_name VARCHAR(50) PRIMARY KEY,
      is_loaded BOOLEAN NOT NULL DEFAULT FALSE
      );
      `;

      const updateCounter = (tableName, isLoaded) => `
      INSERT INTO counter (table_name, is_loaded)
      VALUES ('${tableName}', '${isLoaded}')
      ON CONFLICT (table_name)
      DO UPDATE SET is_loaded = ${isLoaded};
      `;

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

    await databaseClient.query(createCounterTable);

    const createTables = [
      `CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        date VARCHAR(50) NOT NULL,
        summary VARCHAR(255) NOT NULL,
        body VARCHAR(2000) NOT NULL,
        recommend BOOLEAN NOT NULL,
        reported BOOLEAN NOT NULL,
        reviewer_name VARCHAR(50) NOT NULL,
        reviewer_email VARCHAR(50) NOT NULL,
        response VARCHAR(255) DEFAULT NULL,
        helpfulness INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS characteristics (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        name varchar(50)
      )`
    ];

    for (const table of createTables) {
      await databaseClient.query(table);
      console.log(`${table} created`)
    }

    const { rows: reviewsCounterRows } = await databaseClient.query(
      `SELECT is_loaded FROM counter WHERE table_name = 'reviews';`
    );

    const reviewsTableLoaded = reviewsCounterRows.length > 0 && reviewsCounterRows[0].is_loaded;

    if (!reviewsTableLoaded) {
      console.log('loading data into reviews table');
      let CSVPath = path.join(__dirname, 'csvFiles/reviews.csv');

      const copyReviewsQuery = `
      COPY reviews (
        id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness
      )
      FROM '${CSVPath}'
      DELIMITER ','
      CSV HEADER;
      `;
      await pool.query(copyReviewsQuery);
      await databaseClient.query(updateCounter('reviews', true));
      console.log('copied csv files into reviews table');
    } else {
      console.log('reviews table already has data');
    }

    const { rows: characteristicsCounterRows } = await databaseClient.query(
      `SELECT is_loaded FROM counter WHERE table_name = 'characteristics';`
    );

    const characteristicsTableLoaded = characteristicsCounterRows.length > 0 && characteristicsCounterRows[0].is_loaded;

    if (!characteristicsTableLoaded) {
      console.log('loading data into charateristics table');
      let CSVPath = path.join(__dirname, 'csvFiles/characteristics.csv');

      const copyCharacteristicsQuery = `
      COPY characteristics (
        id, product_id, name
      )
      FROM '${CSVPath}'
      DELIMITER ','
      CSV HEADER;
      `;
      await pool.query(copyCharacteristicsQuery);
      await databaseClient.query(updateCounter('characteristics', true));
      console.log('copied csv files into characteristics table');
    } else {
      console.log('characteristics table already has data');
    }

    await databaseClient.end();
    await pool.end();
  } catch (error) {
    console.error('error', error);
  }
  }

  createDatabase().catch(console.error);
