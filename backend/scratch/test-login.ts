import { env } from '../src/config/env';

const BASE_URL = `http://localhost:${env.PORT || 5050}/api/auth`;

async function main() {
  const loginPayload = {
    identifier: 'mdmainuddin1289@gmail.com',
    password: 'Moinkhan@123',
  };

  console.log(`Sending login request to ${BASE_URL}/login...`);
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginPayload),
    });
    console.log('Response Status:', res.status);
    const data = await res.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

main();
