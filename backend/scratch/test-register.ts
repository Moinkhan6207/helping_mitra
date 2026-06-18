import { env } from '../src/config/env';

const BASE_URL = `http://localhost:${env.PORT || 5050}/api/auth`;

async function main() {
  const registerPayload = {
    name: 'Moin Khan',
    mobile: '9000000001',
    email: 'mdmainuddin1289@gmail.com',
    password: 'Moinkhan@123',
    confirmPassword: 'Moinkhan@123',
    shopName: 'Mitra Shop',
    aadhaarNumber: '123456789012',
    panNumber: 'ABCDE1234F',
    address: '123 Test Street',
    state: 'West Bengal',
    district: 'Kolkata',
    pinCode: '700001',
    userType: 'RETAILER',
  };

  console.log(`Sending registration request to ${BASE_URL}/register...`);
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload),
    });
    console.log('Response Status:', res.status);
    const data = await res.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

main();
