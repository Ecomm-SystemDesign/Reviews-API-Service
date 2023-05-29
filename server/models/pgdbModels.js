const pgdb = require('../database/pgdb.js');

module.exports = {
  getProductReviews: (page = 1, count = 5, sort, product_id) => {
    const query = {
      text: `SELECT reviews.*, TO_CHAR(TO_TIMESTAMP(reviews.date::bigint / 1000), 'YYYY-MM_DD"T"HH24:MI:SS.MS"Z"') AS formatted_date, array_agg(
        CONCAT ('id: ', photos.id, ', url: ', photos.url, '')
      ) AS photos_data
      FROM reviews
      JOIN photos ON reviews.id = photos.review_id
      WHERE reviews.product_id = $1
      GROUP BY reviews.id
      ORDER BY reviews.date DESC`,
      values: [product_id]
  };
    return pgdb.pool.query(query);
  }
}