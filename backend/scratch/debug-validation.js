const http = require('http');

const PORT = 5050;

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
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
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('Logging in...');
  const loginRes = await makeRequest('POST', '/api/auth/login', {}, {
    identifier: 'mdmainuddin1289@gmail.com',
    password: 'Moinkhan@123'
  });

  if (loginRes.status !== 200) {
    console.error('Login failed:', loginRes.body);
    return;
  }

  const token = loginRes.body.data.accessToken;
  const userId = loginRes.body.data.user.id;
  const headers = { 'Authorization': `Bearer ${token}` };
  console.log(`Logged in successfully. User ID: ${userId}`);

  const payload = {
    title: 'Shri (Mr.)',
    applicantName: 'Rahul Kumar Verma',
    fatherName: 'Sanjay Verma',
    motherName: 'Sunita Verma',
    gender: 'Male',
    dob: '1995-05-15',
    mobileNumber: '9876543210',
    emailId: 'rahul.verma@example.com',
    aadhaarNumber: '123456789012',
    fullAddress: '123, Main Street, Near Metro Station, New Delhi, 110001',
    userId: userId,
    uploads: {
      aadhaarCard: {
        storagePath: `/users/${userId}/temp/upl_12345/aadhaarCard-1782548109000.pdf`,
        fileName: 'aadhaar.pdf',
        mimeType: 'application/pdf',
        fileSize: 100,
        documentKey: 'aadhaarCard'
      },
      passportPhoto: {
        storagePath: `/users/${userId}/temp/upl_12345/passportPhoto-1782548109000.jpg`,
        fileName: 'photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 100,
        documentKey: 'passportPhoto'
      },
      signature: {
        storagePath: `/users/${userId}/temp/upl_12345/signature-1782548109000.png`,
        fileName: 'signature.png',
        mimeType: 'image/png',
        fileSize: 100,
        documentKey: 'signature'
      },
      birthProof: {
        storagePath: `/users/${userId}/temp/upl_12345/birthProof-1782548109000.pdf`,
        fileName: 'birth.pdf',
        mimeType: 'application/pdf',
        fileSize: 100,
        documentKey: 'birthProof'
      }
    }
  };

  console.log('Sending validate request...');
  const validateRes = await makeRequest('POST', '/api/services/new-pan-apply/validate', headers, payload);
  console.log(`Status: ${validateRes.status}`);
  console.log('Response Body:', JSON.stringify(validateRes.body, null, 2));
}

run();
