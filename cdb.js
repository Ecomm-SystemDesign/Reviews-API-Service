require('dotenv').config();
const cassandra = require('cassandra-driver');
const fs = require('fs');
const path = require('path');

const client = new cassandra.Client({
  contactPoints: [process.env.CASSANDRA_CONTACT_POINT],
  localDataCenter: process.env.CASSANDRA_LOCAL_DC,
  credentials: { username: process.env.CASSANDRA_USERNAME, password: process.env.CASSANDRA_PASSWORD }
});

async function createSchema() {
  try {
    await client.connect();

    const createKeyspace = `CREATE KEYSPACE IF NOT EXISTS ${process.env.CASSANDRA_KEYSPACE} WITH REPLICATION = { 'class': 'SimpleStrategy', 'replication_factor': 1}`;
    await client.execute(createKeyspace);
    console.log(`keyspace ${process.env.CASSANDRA_KEYSPACE} created`);

    const photosTableQuery = `CREATE TABLE IF NOT EXISTS ${process.env.CASSANDRA_KEYSPACE}.photos (
      id INT PRIMARY KEY,
      review_id INT,
      url TEXT
    )`
    await client.execute(photosTableQuery);
    console.log('images table created');

    const tableMetaData = await client.metadata.getTable(process.env.CASSANDRA_KEYSPACE, 'photos');
    if (tableMetaData.columns.length === 0) {
      const photoData = fs.readFileSync(path.join(__dirname, 'csvFiles/reviews_photos.csv'), 'utf8');
      const photoDataRows = photoData.split('\n');

      for (let i = 1; i < photoDataRows.length; i++) {
        const values = photoDataRows[i].split(',');
        const id = parseInt(values[0]);
        const reviewId = parseInt(values[1]);
        const url = values[2].replace(/"/g, '');

        const insertQuery = `INSERT INTO ${process.env.CASSANDRA_KEYSPACE}.photos (id, review_id, url) VALUES (?, ?, ?)`;
        await client.execute(insertQuery, [id, reviewId, url], {prepare: true});
      }

      console.log('Data inserted into Cassandra');
    } else {
      console.log('photos table already contains data');
    }
  } catch(err) {
    console.error('Error: ', err)
  }
}

createSchema().catch(console.error);