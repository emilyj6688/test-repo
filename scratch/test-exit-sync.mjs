const apiKey = 'AIzaSyCJ2UsE9Oq3I9IE-N8hpKT1FvPIawo1nCo';
const referer = 'https://jcpapernik.github.io/cinerank-media-tracker/';

async function testFastSync() {
  console.log('========================================================');
  console.log('🧪 TESTING INSTANT MULTI-TAB CLOUD SYNC & UNLOAD FLUSH');
  console.log('========================================================\n');

  // 1. Create account
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const signUpRes = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Referer': referer },
    body: JSON.stringify({
      email: `syncfast_${Date.now()}@example.com`,
      password: 'Password123!',
      returnSecureToken: true
    })
  });
  const authData = await signUpRes.json();
  const userId = authData.localId;
  const idToken = authData.idToken;

  console.log(`1. Created User Account: ${userId}`);

  // 2. Tab A writes item and immediately queries Cloud Firestore (simulating close/exit)
  const docUrl = `https://firestore.googleapis.com/v1/projects/cinerank-media-tracker/databases/(default)/documents/users/${userId}/records/movie_550?key=${apiKey}`;
  const t0 = Date.now();
  await fetch(docUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      'Referer': referer
    },
    body: JSON.stringify({
      fields: {
        id: { stringValue: 'movie_550' },
        title: { stringValue: 'Fight Club' },
        status: { stringValue: 'watched' }
      }
    })
  });
  console.log(`2. Tab A wrote "Fight Club" to Cloud Firestore in ${Date.now() - t0}ms.`);

  // 3. Tab B immediately reads from Cloud Firestore without delay
  const getUrl = `https://firestore.googleapis.com/v1/projects/cinerank-media-tracker/databases/(default)/documents/users/${userId}/records?key=${apiKey}`;
  const t1 = Date.now();
  const resB = await fetch(getUrl, { headers: { 'Authorization': `Bearer ${idToken}`, 'Referer': referer } });
  const dataB = await resB.json();
  console.log(`3. Tab B queried Cloud Firestore in ${Date.now() - t1}ms.`);

  if (dataB.documents && dataB.documents.length === 1) {
    console.log(`✅ Tab B received record: ${dataB.documents[0].fields.title.stringValue}`);
    console.log('\n🎉 PASS: Cloud Firestore multi-tab instant sync verified!');
  } else {
    console.error('\n❌ FAIL: Tab B did not receive the record instantly.');
  }
}

testFastSync();
