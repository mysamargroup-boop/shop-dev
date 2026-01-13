
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://atauvytuspdpwkzhilkb.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YXV2eXR1c3BkcHdremhpbGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTQzNDksImV4cCI6MjA4MzczMDM0OX0.QfQzv6Kx8rX2WHz6uFnVB4bvpBpHeh2cPb-4C13UHLc";

const FUNCTION_PATH = '/functions/v1/analytics-ingest';
const HOSTNAME = 'atauvytuspdpwkzhilkb.supabase.co';

const payload = {
    events: [
        {
            sessionId: `test_session_${Date.now()}`,
            pageUrl: '/test-page',
            eventType: 'page_view',
            elementSelector: null,
            referrer: 'direct',
            utmSource: null,
            utmMedium: null,
            utmCampaign: null
        },
        {
            sessionId: `test_session_${Date.now()}`,
            pageUrl: '/test-page',
            eventType: 'click',
            elementSelector: '#submit-button',
            referrer: 'direct',
            utmSource: null,
            utmMedium: null,
            utmCampaign: null
        }
    ]
};

console.log("--- Starting Analytics Ingest Test ---");
console.log("Target:", `https://${HOSTNAME}${FUNCTION_PATH}`);

const options = {
  hostname: HOSTNAME,
  port: 443,
  path: FUNCTION_PATH,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    // Mocking Vercel headers for testing (though Supabase might not respect them unless configured)
    'x-vercel-ip-city': 'Mumbai',
    'x-vercel-ip-country': 'IN'
  }
};

const req = https.request(options, (res) => {
  console.log('Response Status:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
        console.log('Response Body:', data);
        const parsedData = JSON.parse(data);
        if (res.statusCode >= 200 && res.statusCode < 300 && parsedData.success) {
            console.log("\n✅ Test PASSED: Analytics events recorded.");
            console.log("Check your Supabase 'visitors' table.");
        } else {
            console.log("\n❌ Test FAILED: Non-success response.");
        }
    } catch (e) {
        console.log("Response (Raw):", data);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ Request Error: ${e.message}`);
});

req.write(JSON.stringify(payload));
req.end();
