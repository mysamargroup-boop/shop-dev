const https = require('https');

const options = {
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: '/v1beta/models?key=' + process.env.GOOGLE_API_KEY,
  method: 'GET'
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', d => {
    data += d;
  });
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
