import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 500 },
    { duration: '30s', target: 1000 },
    { duration: '30s', target: 1400 },
    { duration: '3m', target: 1500 },
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
];

export default function () {
  const rangeIndex = Math.floor(Math.random() * productRanges.length);
  const { min, max } = productRanges[rangeIndex];
  const productId = Math.floor(Math.random() * (max - min + 1)) + min;

  const reviewUrl = `http://localhost:3001/reviews?page=1&count=500&sort=relevant&product_id=${productId}`;
  const metaUrl = `http://localhost:3001/reviews/meta?product_id=${productId}`;

  const requests = [
    { url: reviewUrl, method: 'GET' },
    { url: metaUrl, method: 'GET' },
  ];

  const responses = http.batch(requests);

  sleep(1);
}