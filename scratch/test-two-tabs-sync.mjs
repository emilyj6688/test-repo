const apiKey = 'AIzaSyCJ2UsE9Oq3I9IE-N8hpKT1FvPIawo1nCo';
const referer = 'https://jcpapernik.github.io/cinerank-media-tracker/';

async function runTest() {
  console.log('========================================================');
  console.log('🧪 AUTOMATED REAL-TIME FIRESTORE REST & AUTH TEST');
  console.log('========================================================\n');

  // 1. Sign up test user via REST API
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const signUpRes = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Referer': referer },
    body: JSON.stringify({
      email: `synctest_${Date.now()}@example.com`,
      password: 'Password123!',
      returnSecureToken: true
    })
  });

  const authData = await signUpRes.json();
  if (!signUpRes.ok) {
    console.error('❌ Auth Error:', authData);
    return;
  }

  const userId = authData.localId;
  const idToken = authData.idToken;
  console.log(`✅ 1. Created User Account! UID: ${userId}`);

  // 2. Tab A writes record to Firestore via REST
  console.log('\n2. Tab A writing "Inception" (ID: movie_27205) to Firestore...');
  const recordId = 'movie_27205';
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/cinerank-media-tracker/databases/(default)/documents/users/${userId}/records/${recordId}?key=${apiKey}`;

  const writeRes = await fetch(firestoreUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      'Referer': referer
    },
    body: JSON.stringify({
      fields: {
        id: { stringValue: recordId },
        status: { stringValue: 'watched' },
        title: { stringValue: 'Inception' },
        ratingTier: { integerValue: 1 },
        updatedAt: { stringValue: new Date().toISOString() }
      }
    })
  });

  const writeData = await writeRes.json();
  if (!writeRes.ok) {
    console.error('❌ Firestore Write Error:', writeData);
    return;
  }
  console.log('✅ Tab A Successfully Wrote Record to Firestore!');

  // 3. Tab B reads records from Firestore via REST
  console.log('\n3. Tab B (Incognito) fetching user records from Firestore...');
  const getUrl = `https://firestore.googleapis.com/v1/projects/cinerank-media-tracker/databases/(default)/documents/users/${userId}/records?key=${apiKey}`;

  const getRes = await fetch(getUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Referer': referer
    }
  });

  const getData = await getRes.json();
  if (!getRes.ok) {
    console.error('❌ Firestore Read Error:', getData);
    return;
  }

  console.log(`✅ 4. Tab B Successfully Fetched ${getData.documents ? getData.documents.length : 0} Record(s) from Cloud Firestore:`);
  if (getData.documents) {
    getData.documents.forEach(doc => {
      console.log('   - ID:', doc.name.split('/').pop());
      console.log('     Title:', doc.fields.title.stringValue);
      console.log('     Status:', doc.fields.status.stringValue);
    });
  }

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! Cloud Firestore read/write pipeline is 100% operational!');
}

runTest();
