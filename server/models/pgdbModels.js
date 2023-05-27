const pgdb = require('../database/pgdb.js');

module.exports = {
  getProductReviews: (page = 1, count = 5, sort, product_id) => {
    const query = {
      text: `SELECT * FROM reviews WHERE product_id = $1`,
      values: [product_id]
  };
    return pgdb.pool.query(query);
  }
}