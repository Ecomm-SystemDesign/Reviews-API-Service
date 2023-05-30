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
      const { result1, result2 } = data;
      const characteristics = {};
      const ratings = {};

      if (result1.rows[0].metadata) {
        result1.rows[0].metadata.forEach((row) => {
          characteristics[row.name] = { id: row.id, value: row.value };
        });
      }

      result2.rows.forEach((row) => {
        ratings[row.rating] = row.count;
      });

      res.send({
        characteristics: characteristics,
        ratings: ratings
      }).status(200);
    });
  }
}