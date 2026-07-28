const apiKey = 'AIzaSyCJ2UsE9Oq3I9IE-N8hpKT1FvPIawo1nCo';
const referer = 'https://jcpapernik.github.io/cinerank-media-tracker/';

async function testBatchClear() {
  console.log('========================================================');
  console.log('🧪 TESTING FIRESTORE BATCH DELETE FOR 135+ DOCUMENTS');
  console.log('========================================================\n');

  // 1. Sign up test user
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const signUpRes = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Referer': referer },
    body: JSON.stringify({
      email: `batchtest_${Date.now()}@example.com`,
      password: 'Password123!',
      returnSecureToken: true
    })
  });
  const authData = await signUpRes.json();
  const userId = authData.localId;
  const idToken = authData.idToken;

  console.log(`1. Created User Account: ${userId}`);

  // 2. Add 135 items to Firestore
  console.log('2. Writing 135 records to Cloud Firestore...');
  for (let i = 1; i <= 135; i++) {
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
          title: { stringValue: `Movie #${i}` }
        }
      })
    });
  }

  // 3. Fetch to confirm 135 items
  const getUrl = `https://firestore.googleapis.com/v1/projects/cinerank-media-tracker/databases/(default)/documents/users/${userId}/records?pageSize=300&key=${apiKey}`;
  const resBefore = await fetch(getUrl, { headers: { 'Authorization': `Bearer ${idToken}`, 'Referer': referer } });
  const dataBefore = await resBefore.json();
  const countBefore = dataBefore.documents ? dataBefore.documents.length : 0;
  console.log(`✅ Verified: Created ${countBefore} items in Cloud Firestore.`);

  // 4. Batch Delete all documents
  console.log('3. Deleting all 135 documents from Cloud Firestore...');
  if (dataBefore.documents) {
    for (const doc of dataBefore.documents) {
      const deleteUrl = `https://firestore.googleapis.com/v1/${doc.name}?key=${apiKey}`;
      await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}`, 'Referer': referer }
      });
    }
  }

  // 5. Verify 0 items remain
  const resAfter = await fetch(getUrl, { headers: { 'Authorization': `Bearer ${idToken}`, 'Referer': referer } });
  const dataAfter = await resAfter.json();
  const countAfter = dataAfter.documents ? dataAfter.documents.length : 0;
  console.log(`✅ Verified: After wipe, Cloud Firestore has ${countAfter} records.`);

  if (countAfter === 0) {
    console.log('\n🎉 PASS: 135 documents wiped cleanly to 0!');
  } else {
    console.error('\n❌ FAIL: Documents still remain.');
  }
}

testBatchClear();
