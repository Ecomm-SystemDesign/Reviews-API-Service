const { getProductReviews, getReviewsMetaData } = require('../models/pgdbModels.js');

module.exports = {
  getReviews: (req, res) => {
    getProductReviews(req.query.page, req.query.count, req.query.sort, req.query.product_id)
    .then((data) => {
      const results = data.rows.map((row) => ({
        product_id: row.product_id,
        date: row.formatted_date,
        helpfulness: row.helpfulness,
        photos: row.photos_data,
        rating: row.rating,
        recommend: row.recommend,
        response: row.response,
        review_id: row.id,
        reviewer_name: row.reviewer_name,
        summary: row.summary
      }));
      res.send({ results: results }).status(200);
    });
  },

  getReviewsMeta: (req, res) => {
    getReviewsMetaData(req.query.product_id)
    .then((data) => {
      const response = {
        characteristics: {},
        product_id: req.query.product_id,
        ratings: {},
        recommended: {
          false: '0',
          true: '0'
        }
      };
      const { result1, result2 } = data;

      if (result1.rows[0] && result2.rows[0]) {
        result1.rows[0].characteristics.forEach((row) => {
          response.characteristics[row.name] = { id: row.characteristic_id, value: row.avg.toString() }
        });
        result2.rows[0].ratings.forEach((row) => {
          response.ratings[row.rating] = row.count.toString()
        });
        response.recommended.true = result2.rows[0].true;
        response.recommended.true = result2.rows[0].false;
      }


      res.send(response).status(200);
    });
  }
}