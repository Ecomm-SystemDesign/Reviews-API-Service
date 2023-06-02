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

    const queries = [
      {
        text: `
        INSERT INTO reviews (product_id, rating, summary, body, recommend, reviewer_name, reviewer_email, date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
        `,
        values: [product_id, rating, summary, body, recommend, name, email, Date.now()]
      },
      {
        text: `
        INSERT INTO photos (review_id, url)
        VALUES ($1, $2)
        `
      },
      {
        text: `
        INSERT INTO characteristics (product_id, name)
        VALUES ($1, $2)
        RETURNING id
        `
      },
      {
        text: `
        INSERT INTO characteristic_reviews (characteristic_id, review_id, value)
        VALUES ($1, $2, $3)
        `
      }
    ];

    let reviewId;

    return pgdb.pool.query(queries[0])
      .then((result) => {
        reviewId = result.rows[0].id;

        const photoPromises = photos.map((url) => {
          const query = {
            text: queries[1].text,
            values: [reviewId, url]
          };
          return pgdb.pool.query(query);
        });

        return Promise.all(photoPromises);
      })
      .then(() => {
        const characteristicsArray = Object.values(characteristics);
        const names = ['Fit', 'Length', 'Comfort', 'Quality'];
        const characteristicsPromises = characteristicsArray.map((value, index) => {
          const query = {
            text: queries[2].text,
            values: [product_id, names[index]]
          };

          return pgdb.pool.query(query)
            .then((result) => {
              const characteristicId = result.rows[0].id;
              const query = {
                text: queries[3].text,
                values: [characteristicId, reviewId, value]
              };

              return pgdb.pool.query(query);
            });
        });

        return Promise.all(characteristicsPromises);
      });
  }
};
