const { getProductReviews } = require('../models/pgdbModels.js');

const nullHandler = (string) => {
  if (string === 'null') {
    return null;
  } else {
    return string;
  }
}

module.exports = {
  getReviews: (req, res) => {
    getProductReviews(req.query.page, req.query.count, req.query.sort, req.query.product_id)
    .then((data) => {
      const results = data.rows.map((row) => ({
        product_id: row.product_id,
        date: row.date,
        helpfulness: row.helpfulness,
        photos: [{id: 'to be implemented', url: 'to be implemented'}],
        rating: row.rating,
        recommend: row.recommend,
        response: nullHandler(row.response),
        review_id: row.id,
        reviewer_name: row.reviewer_name,
        summary: row.summary
      }));
      res.send({ results: results }).status(200);
    });
  }
}