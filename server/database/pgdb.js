require('dotenv').config();
const { Client, Pool } = require('pg');
const fs = require('fs');
const readline = require('node:readline');
const path = require('path');

const client = new Client({
  host: process.env.HOST,
  port: process.env.PG_PORT,
  user: process.env.USER,
  password: process.env.PASSWORD
});

const pool = new Pool({
  host: process.env.HOST,
  port: process.env.PG_PORT,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
});

async function createDatabase() {

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
      port: process.env.PG_PORT,
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
        date BIGINT NOT NULL,
        summary VARCHAR(255) NOT NULL,
        body VARCHAR(2000) NOT NULL,
        recommend BOOLEAN NOT NULL,
        reported BOOLEAN NOT NULL,
        reviewer_name VARCHAR(50) NOT NULL,
        reviewer_email VARCHAR(50) NOT NULL,
        response VARCHAR(255) DEFAULT NULL,
        helpfulness INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS photos(
      id SERIAL PRIMARY KEY,
      review_id INT,
      url TEXT,
      CONSTRAINT fk_review_id
        FOREIGN KEY(review_id)
          REFERENCES reviews(id)
          ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS characteristic_reviews(
        id SERIAL PRIMARY KEY,
        characteristic_id INT,
        review_id INT,
        value SMALLINT,
        CONSTRAINT fk_review_id
        FOREIGN KEY(review_id)
          REFERENCES reviews(id)
          ON DELETE CASCADE
      )`,
        `CREATE TABLE IF NOT EXISTS characteristics(
          id SERIAL PRIMARY KEY,
          product_id INT,
          name VARCHAR(10),
          CONSTRAINT fk_id
          FOREIGN KEY(id)
            REFERENCES characteristics(id)
            ON DELETE CASCADE
        )`
    ];

    for (const table of createTables) {
      await databaseClient.query(table);
      console.log(`${table} created`)
    }

    const createReviewsIndexQuery = `CREATE INDEX idx_reviews_product_id ON reviews (product_id)`;
    //await databaseClient.query(createReviewsIndexQuery);
    //uncomment above if not applied yet;

    const createPhotosIndexQuery = `CREATE INDEX idx_photos_review_id ON photos (review_id)`;
    //await databaseClient.query(createPhotosIndexQuery);
    //uncomment above if not applied yet;

    const createCharacteristicReviewsIndexQuery = `CREATE INDEX idx_characteristic_reviews_review_id ON characteristic_reviews (review_id)`;
    // await databaseClient.query(createCharacteristicReviewsIndexQuery);
    //uncomment above if not applied yet;

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
      CSV NULL 'null'
      HEADER;
      `;
      await pool.query(copyReviewsQuery);
      await databaseClient.query(updateCounter('reviews', true));
      console.log('copied csv files into reviews table');
    } else {
      console.log('reviews table already has data');
    }

    const { rows: photosCounterRows } = await databaseClient.query(
      `SELECT is_loaded FROM counter WHERE table_name = 'photos';`
    );

    const photosTableLoaded = photosCounterRows.length > 0 && photosCounterRows[0].is_loaded;

    if (!photosTableLoaded) {
      console.log('loading data into photos table');
      let CSVPath = path.join(__dirname, 'csvFiles/reviews_photos.csv');

      const copyPhotosQuery = `
      COPY photos (
        id, review_id, url
      )
      FROM '${CSVPath}'
      DELIMITER ','
      CSV NULL 'null'
      HEADER;
      `;
      await pool.query(copyPhotosQuery);
      await databaseClient.query(updateCounter('photos', true));
      console.log('copied csv files into photos table');
    } else {
      console.log('photos table already has data');
    }

    const { rows: characteristicReviewsCounterRows } = await databaseClient.query(
      `SELECT is_loaded FROM counter WHERE table_name = 'characteristic_reviews';`
    );

    const characteristicReviewsTableLoaded = characteristicReviewsCounterRows.length > 0 && characteristicReviewsCounterRows[0].is_loaded;

    if (!characteristicReviewsTableLoaded) {
      console.log('loading data into characteristic_reviews table');
      let CSVPath = path.join(__dirname, 'csvFiles/characteristic_reviews.csv');

      const copyCharacteristicReviewsQuery = `
      COPY characteristic_reviews (
        id, characteristic_id, review_id, value
      )
      FROM '${CSVPath}'
      DELIMITER ','
      CSV NULL 'null'
      HEADER;
      `;
      await pool.query(copyCharacteristicReviewsQuery);
      await databaseClient.query(updateCounter('characteristic_reviews', true));
      console.log('copied csv files into characteristic_reviews table');
    } else {
      console.log('characteristic_reviews table already has data');
    }

    const { rows: characteristicsCounterRows } = await databaseClient.query(
      `SELECT is_loaded FROM counter WHERE table_name = 'characteristics';`
    );

    const characteristicsTableLoaded = characteristicsCounterRows.length > 0 && characteristicsCounterRows[0].is_loaded;

    if (!characteristicsTableLoaded) {
      console.log('loading data into characteristics table');
      let CSVPath = path.join(__dirname, 'csvFiles/characteristics.csv');

      const copyCharacteristicsQuery = `
      COPY characteristics (
        id, product_id, name
      )
      FROM '${CSVPath}'
      DELIMITER ','
      CSV NULL 'null'
      HEADER;
      `;
      await pool.query(copyCharacteristicsQuery);
      await databaseClient.query(updateCounter('characteristics', true));
      console.log('copied csv files into characteristics table');
    } else {
      console.log('Characteristics table already has data');
    }

  } catch (error) {
    console.error('error', error);
  }
  }

  createDatabase().catch(console.error);

  async function closeDatabase() {
    try {
      await client.end();
      await pool.end();
      console.log('Database connections closed.');
    } catch (error) {
      console.error('Error closing database connections:', error);
    }
  }

  // Call closeDatabase() when you want to shut down the application or explicitly close the connections.

  module.exports = {
    pool
  };