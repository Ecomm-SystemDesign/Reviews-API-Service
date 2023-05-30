require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const { getReviews, getReviewsMeta } = require('./controllers/controllers.js');

const app = express();

app.use(morgan('dev'));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const router = express.Router();
app.use(router);

//routes
router.get('/reviews', getReviews);
router.get('/reviews/meta', getReviewsMeta);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server listening on PORT ${PORT}`);
});