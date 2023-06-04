import http from 'k6/http';
import { sleep, randomIntBetween } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 1000 },
  ],

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(99)<2000'],
  },
};

export default function () {
  const payload = {
    product_id: Math.floor(Math.random() * 1000000) + 1,
    rating: Math.floor(Math.random() * 5) + 1,
    summary: 'Test summary',
    body: 'Test body',
    recommend: Math.random() < 0.5,
    name: 'Test user',
    email: 'test@example.com',
    photos: ['http://example.com/photo1.jpg', 'http://example.com/photo2.jpg'],
    characteristics: {
      Fit: Math.floor(Math.random() * 5) + 1,
      Length: Math.floor(Math.random() * 5) + 1,
      Comfort: Math.floor(Math.random() * 5) + 1,
      Quality: Math.floor(Math.random() * 5) + 1,
    },
  };

  const headers = { 'Content-Type': 'application/json' };

  const response = http.post('http://localhost:3001/reviews', JSON.stringify(payload), { headers });

  if (response.status === 201) {
    console.log('Review added successfully');
  } else {
    console.log(`Failed to add review. Status: ${response.status}`);
  }
  sleep(1);
}
