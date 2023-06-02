// require('dotenv').config();
// const cassandra = require('cassandra-driver');
// const { types } = cassandra;
// const fs = require('fs');
// const path = require('path');

// const client = new cassandra.Client({
//   contactPoints: [process.env.CASSANDRA_CONTACT_POINT],
//   localDataCenter: process.env.CASSANDRA_LOCAL_DC,
//   credentials: { username: process.env.CASSANDRA_USERNAME, password: process.env.CASSANDRA_PASSWORD }
// });

// async function createSchema() {
//   try {
//     await client.connect();

//     const createKeyspace = `CREATE KEYSPACE IF NOT EXISTS ${process.env.CASSANDRA_KEYSPACE} WITH REPLICATION = { 'class': 'SimpleStrategy', 'replication_factor': 1}`;
//     await client.execute(createKeyspace);
//     console.log(`keyspace ${process.env.CASSANDRA_KEYSPACE} created`);

//     const counterTable = `CREATE TABLE IF NOT EXISTS ${process.env.CASSANDRA_KEYSPACE}.counter (
//       counter_name TEXT PRIMARY KEY,
//       counter_value COUNTER
//     )`;
//     await client.execute(counterTable);

//     const initialCounterQuery = `UPDATE ${process.env.CASSANDRA_KEYSPACE}.counter SET counter_value = counter_value + ? WHERE counter_name = ?`;
//     await client.execute(initialCounterQuery, [0, 'characteristics'], {prepare: true});
//     await client.execute(initialCounterQuery, [0, 'characteristic_reviews'], {prepare: true});
//     console.log('initial counter value inserted');
//     const getCount = `SELECT counter_value FROM ${process.env.CASSANDRA_KEYSPACE}.counter WHERE counter_name = ?`;
//     const characteristicsResult = await client.execute(getCount, ['characteristics']);
//     const characteristicsCount = characteristicsResult.rows[0].counter_value;
//     console.log('Characteristics counter value:', characteristicsCount);
//     const characteristicReviewsResult = await client.execute(getCount, ['characteristic_reviews']);
//     const characteristicReviewsCount = characteristicReviewsResult.rows[0].counter_value;
//     console.log('Characteristic_reviews counter value:', characteristicsCount);
//     const incrementCounterQuery = `UPDATE ${process.env.CASSANDRA_KEYSPACE}.counter SET counter_value = counter_value + 1 WHERE counter_name = ?`;

//     const characteristicsTableQuery = `CREATE TABLE IF NOT EXISTS ${process.env.CASSANDRA_KEYSPACE}.characteristics (
//       id INT PRIMARY KEY,
//       product_id INT,
//       name TEXT
//     )`
//     await client.execute(characteristicsTableQuery);
//     console.log('characteristics table created');

//     if (characteristicsCount.equals(cassandra.types.Long.ZERO)) {
//       const characteristicsData = fs.readFileSync(path.join(__dirname, 'csvFiles/characteristics.csv'), 'utf8');
//       const characteristicsDataRows = characteristicsData.split('\n');

//       for (let i = 1; i < characteristicsDataRows.length; i++) {
//         const values = characteristicsDataRows[i].split(',');
//         const id = parseInt(values[0]);
//         const productId = parseInt(values[1]);
//         const name = values[2].replace(/"/g, '');

//         const insertQuery = `INSERT INTO ${process.env.CASSANDRA_KEYSPACE}.characteristics (id, product_id, name) VALUES (?, ?, ?)`;
//         await client.execute(insertQuery, [id, productId, name], {prepare: true});
//       }
//       console.log('Data inserted into Cassandra');
//       await client.execute(incrementCounterQuery, ['characteristics'], {prepare: true});
//       console.log('characteristics counter incremented');
//     } else {
//       console.log('characteristics table already contains data');
//     }

//     const characteristicReviews = `CREATE TABLE IF NOT EXISTS ${process.env.CASSANDRA_KEYSPACE}.characteristic_reviews (
//       id INT PRIMARY KEY,
//       characteristic_id INT,
//       review_id INT,
//       value INT
//     )`;
//     await client.execute(characteristicReviews);
//     console.log('characteristic_reviews table created');

//     if (characteristicReviewsCount.equals(cassandra.types.Long.ZERO)) {
//       const characteristicReviewsData = fs.readFileSync(path.join(__dirname, 'csvFiles/characteristic_reviews.csv'), 'utf8');
//       const characteristicReviewsDataRows = characteristicReviewsData.split('\n');

//       for (var i = 1; i < characteristicReviewsDataRows.length; i++) {
//         const values = characteristicReviewsDataRows[i].split(',');
//         const id = parseInt(values[0]);
//         const characteristicId = parseInt(values[1]);
//         const reviewId = parseInt(values[2]);
//         const value = parseInt(values[3]);

//         const insertQuery = `INSERT INTO ${process.env.CASSANDRA_KEYSPACE}.characteristic_reviews (id, characteristic_id, review_id, value) VALUES (?, ?, ?, ?)`;
//         await client.execute(insertQuery, [id, characteristicId, reviewId, value], {prepare: true})
//       }
//       console.log('data inserted into characteristic_reviews');
//       await client.execute(incrementCounterQuery, ['characteristic_reviews'], {prepare: true});
//       console.log('Characteristic_reviews counter incremented');
//     } else {
//       console.log('characteristic_reviews already contains data');
//     }

//   } catch(err) {
//     console.error('Error: ', err)
//   }
// }

// createSchema().catch(console.error);

// module.exports = {
//   client
// };
