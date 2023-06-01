const pgdb = require('../database/pgdb.js');

module.exports = {
  getProductReviews: (page = 1, count = 5, sort, product_id) => {
    let order = '';

    if (sort === 'relevant') {
      order = `ORDER BY
        CASE WHEN reviews.helpfulness <= (SELECT MAX(reviews.helpfulness) FROM reviews WHERE reviews.product_id = $1) - 2 THEN reviews.helpfulness END DESC,
        CASE WHEN reviews.helpfulness > (SELECT MAX(reviews.helpfulness) FROM reviews WHERE reviews.product_id = $1) - 2 THEN reviews.date END DESC`;
    } else if (sort === 'newest') {
      order = `ORDER BY reviews.date DESC, reviews.helpfulness DESC`;
    } else if (sort === 'helpful') {
      order = `ORDER BY reviews.helpfulness DESC, reviews.date DESC`;
    }

    const query = {
      text: `SELECT reviews.*, TO_CHAR(TO_TIMESTAMP(reviews.date::bigint / 1000), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS formatted_date, array_agg(
        CONCAT('id: ', photos.id, ', url: ', photos.url, '')
      ) AS photos_data
      FROM reviews
      LEFT JOIN photos ON reviews.id = photos.review_id
      WHERE reviews.product_id = $1
      GROUP BY reviews.id, reviews.product_id, reviews.rating, reviews.date, reviews.summary, reviews.body, reviews.recommend, reviews.reported, reviews.reviewer_name, reviews.reviewer_email, reviews.response, reviews.helpfulness
      ${order}`,
      values: [product_id]
    };

    return pgdb.pool.query(query);
  },

  getReviewsMetaData: (product_id) => {

    async function executeQueries() {
      try {
        const client = await pgdb.pool.connect();
        const query1 = {
          text:  `
          SELECT * FROM characteristics_metadata WHERE product_id = $1
          `,
          values: [product_id]
        };
        const result1 = await client.query(query1);

        const query2 = {
          text:  `
          SELECT * FROM metadata_aggregation WHERE product_id = $1
          `,
          values: [product_id]
        };
        const result2 = await client.query(query2);

        client.release();

        return {
          result1,
          result2
        }
      } catch (error) {
        console.error(error);
      }
    };
    return executeQueries();
  },

  addReview: (product_id, rating, summary, body, recommend, name, email, photos, characteristics) => {
    const query = {
      text: `
      INSERT INTO reviews (product_id, rating, summary, body, recommend, name, email, photos, characterstics) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `,
      values: [product_id, rating, summary, body, recommend, name, email, photos, characteristics]
    };
    return pgdb.pool.query(query);
  }
};
