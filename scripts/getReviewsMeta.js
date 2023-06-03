import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 500 },
    { duration: '60s', target: 500 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(99)<2000'],
  },
};

const productRanges = [
  { min: 800000, max: 1000000 },
  { min: 600000, max: 800000 },
  { min: 400000, max: 600000 },
  { min: 200000, max: 400000 },
  { min: 0, max: 200000 },
]

export default () => {
  const rangeIndex = Math.floor(Math.random() * productRanges.length);
  const { min, max } = productRanges[rangeIndex];
  const productId = Math.floor(Math.random() * (max - min + 1)) + min;

  const url = `http://localhost:3001/reviews/meta?product_id=${productId}`;
  const response = http.get(url);
  sleep(1);
};
