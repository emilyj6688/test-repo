const apiKey = 'AIzaSyCJ2UsE9Oq3I9IE-N8hpKT1FvPIawo1nCo';

async function testWithValidPassword(refererUrl) {
  console.log(`\nTesting Identity Toolkit API with Referer: "${refererUrl}" & Valid Password...`);
  const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (refererUrl) headers['Referer'] = refererUrl;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: `test_${Date.now()}@example.com`,
        password: 'Password123!',
        returnSecureToken: true
      })
    });
    
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ SUCCESS! Created user ID: ${data.localId}`);
      console.log(`   ID Token: ${data.idToken.slice(0, 20)}...`);
      return data;
    } else {
      console.log(`❌ FAILED (${res.status}):`, data.error ? data.error.message : data);
    }
  } catch (err) {
    console.error('❌ Fetch Error:', err.message);
  }
}

async function runAllTests() {
  await testWithValidPassword('https://jcpapernik.github.io/cinerank-media-tracker/');
  await testWithValidPassword('https://emilyj6688.github.io/test-repo/');
}

runAllTests();
