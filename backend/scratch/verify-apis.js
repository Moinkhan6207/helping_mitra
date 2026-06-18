const http = require('http');

const PORT = 5050;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
          });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runTests() {
  console.log('🧪 Starting API Verification Tests...');
  const tests = [
    { name: '1. Get Categories', path: '/api/services/categories' },
    { name: '2. Get All Services (default page/limit)', path: '/api/services' },
    { name: '3. Get Services with category and search filter', path: '/api/services?page=1&limit=5&category=pan-services&search=find' },
    { name: '4. Get Service Details by slug', path: '/api/services/pan-find-service' },
    { name: '5. Get Service Form Fields', path: '/api/services/pan-find-service/fields' },
    { name: '6. Get Required Documents', path: '/api/services/new-pan-apply/documents' },
    { name: '7. Search Services', path: '/api/services/search?q=pan' },
    { name: '8. Error: Non-existent Service Details', path: '/api/services/non-existent-service' },
    { name: '9. Error: Non-existent Category filter', path: '/api/services?category=non-existent-category' },
    { name: '10. Error: Validation - short search query (q=a)', path: '/api/services/search?q=a' },
    { name: '11. Error: Validation - page=0', path: '/api/services?page=0' },
  ];

  for (const t of tests) {
    console.log(`\n--------------------------------------------`);
    console.log(`Running: ${t.name}`);
    console.log(`Path: ${t.path}`);
    try {
      const result = await makeRequest(t.path);
      console.log(`Status: ${result.status}`);
      console.log(`Response:`, JSON.stringify(result.body, null, 2));
    } catch (e) {
      console.error(`Error:`, e.message);
    }
  }
}

runTests();
