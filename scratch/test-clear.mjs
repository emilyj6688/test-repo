const apiKey = 'AIzaSyCJ2UsE9Oq3I9IE-N8hpKT1FvPIawo1nCo';
const referer = 'https://jcpapernik.github.io/cinerank-media-tracker/';

async function testClearFlow() {
  console.log('========================================================');
  console.log('🧪 TESTING CLOUD FIRESTORE WIPE & CLEAR FLOW');
  console.log('========================================================\n');

  // 1. Sign up a fresh test user
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const signUpRes = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Referer': referer },
    body: JSON.stringify({
      email: `cleartest_${Date.now()}@example.com`,
      password: 'Password123!',
      returnSecureToken: true
    })
  });
  const authData = await signUpRes.json();
  const userId = authData.localId;
  const idToken = authData.idToken;

  console.log(`1. Created User Account: ${userId}`);

  // 2. Add 5 items to Firestore
  console.log('2. Writing 5 records to Cloud Firestore...');
  for (let i = 1; i <= 5; i++) {
    const docUrl = `https://firestore.googleapis.com/v1/projects/cinerank-media-tracker/databases/(default)/documents/users/${userId}/records/movie_${i}?key=${apiKey}`;
    await fetch(docUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'Referer': referer
      },
      body: JSON.stringify({
        fields: {
          id: { stringValue: `movie_${i}` },
          title: { stringValue: `Test Movie ${i}` }
        }
      })
    });
  }

  // 3. Fetch records to confirm they exist
  const getUrl = `https://firestore.googleapis.com/v1/projects/cinerank-media-tracker/databases/(default)/documents/users/${userId}/records?key=${apiKey}`;
  const resBefore = await fetch(getUrl, { headers: { 'Authorization': `Bearer ${idToken}`, 'Referer': referer } });
  const dataBefore = await resBefore.json();
  console.log(`✅ Verified: User currently has ${dataBefore.documents ? dataBefore.documents.length : 0} records in Cloud Firestore.`);

  // 4. Delete all documents via REST API
  console.log('3. Deleting all documents from Cloud Firestore...');
  if (dataBefore.documents) {
    for (const doc of dataBefore.documents) {
      const deleteUrl = `https://firestore.googleapis.com/v1/${doc.name}?key=${apiKey}`;
      await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}`, 'Referer': referer }
      });
    }
  }

  // 5. Fetch records after delete to verify 0 items remain
  const resAfter = await fetch(getUrl, { headers: { 'Authorization': `Bearer ${idToken}`, 'Referer': referer } });
  const dataAfter = await resAfter.json();
  const countAfter = dataAfter.documents ? dataAfter.documents.length : 0;
  console.log(`✅ Verified: User now has ${countAfter} records in Cloud Firestore.`);

  if (countAfter === 0) {
    console.log('\n🎉 PASS: Cloud Firestore wipe works 100% cleanly!');
  } else {
    console.error('\n❌ FAIL: Items were not wiped cleanly.');
  }
}

testClearFlow();
