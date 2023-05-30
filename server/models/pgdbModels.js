const pgdb = require('../database/pgdb.js');

module.exports = {
  getProductReviews: (page = 1, count = 5, sort, product_id) => {
    let order = '';

    if (sort === 'relevant') {
      order = `ORDER BY CASE WHEN row_number <= 3 THEN 0 ELSE 1 END, reviews.helpfulness DESC, reviews.date DESC`;
    } else if (sort === 'newest') {
      order = `ORDER BY reviews.date DESC, reviews.helpfulness DESC`;
    } else if (sort === 'helpful') {
      order = `ORDER BY reviews.helpfulness DESC, reviews.date DESC`;
    }

    const query = {
      text: `SELECT reviews.*, TO_CHAR(TO_TIMESTAMP(reviews.date::bigint / 1000), 'YYYY-MM_DD"T"HH24:MI:SS.MS"Z"') AS formatted_date, array_agg(
        CONCAT('id: ', photos.id, ', url: ', photos.url, '')
      ) AS photos_data
      FROM (
        SELECT reviews.*, ROW_NUMBER() OVER (ORDER BY reviews.helpfulness DESC, reviews.date DESC) AS row_number
        FROM reviews
        WHERE reviews.product_id = $1
      ) AS reviews
      JOIN photos ON reviews.id = photos.review_id
      WHERE reviews.row_number <= 3
      GROUP BY reviews.id, reviews.product_id, reviews.rating, reviews.date, reviews.summary, reviews.body, reviews.recommend, reviews.reported, reviews.reviewer_name, reviews.reviewer_email, reviews.response, reviews.helpfulness, reviews.row_number
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
          SELECT json_agg(json_build_object('name', c.name, 'id', c.id, 'value', avg_value)) AS metadata
          FROM (
          SELECT characteristics.id, characteristics.name, AVG(characteristic_reviews.value)::numeric AS avg_value
          FROM characteristics
          JOIN characteristic_reviews ON characteristics.id = characteristic_reviews.characteristic_id
          WHERE characteristics.product_id = $1
          GROUP BY characteristics.id, characteristics.name
          ) AS c;
          `,
          values: [product_id]
        };
        const result1 = await client.query(query1);

        const query2 = {
          text:  `
          SELECT reviews.rating, COUNT(*)
          FROM reviews
          WHERE reviews.product_id = $1
          GROUP BY reviews.rating
          ORDER BY reviews.rating
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
  }
};
