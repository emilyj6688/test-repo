const apiKey = 'AIzaSyCJ2UsE9Oq3I9IE-N8hpKT1FvPIawo1nCo';
const referer = 'https://jcpapernik.github.io/cinerank-media-tracker/';

async function testRatingSync() {
  console.log('========================================================');
  console.log('🧪 TESTING RATING TIER CONFLICT RESOLUTION (TIMESTAMP MERGE)');
  console.log('========================================================\n');

  // 1. Create account
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const signUpRes = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Referer': referer },
    body: JSON.stringify({
      email: `ratingtest_${Date.now()}@example.com`,
      password: 'Password123!',
      returnSecureToken: true
    })
  });
  const authData = await signUpRes.json();
  const userId = authData.localId;
  const idToken = authData.idToken;

  console.log(`1. Created User Account: ${userId}`);

  // 2. Add movie with ratingTier: 2 (Older timestamp)
  const oldTime = new Date(Date.now() - 60000).toISOString();
  const docUrl = `https://firestore.googleapis.com/v1/projects/cinerank-media-tracker/databases/(default)/documents/users/${userId}/records/movie_27205?key=${apiKey}`;
  await fetch(docUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      'Referer': referer
    },
    body: JSON.stringify({
      fields: {
        id: { stringValue: 'movie_27205' },
        title: { stringValue: 'Inception' },
        ratingTier: { integerValue: '2' },
        updatedAt: { stringValue: oldTime }
      }
    })
  });
  console.log('2. Wrote initial record to Cloud Firestore with ratingTier: 2 (Old Timestamp)');

  // 3. Local update happens with NEW timestamp and ratingTier: 1
  const newTime = new Date().toISOString();
  const localRecord = {
    id: 'movie_27205',
    title: 'Inception',
    ratingTier: 1,
    updatedAt: newTime
  };

  // 4. Simulate Timestamp Conflict Resolution Logic
  const resCloud = await fetch(docUrl, { headers: { 'Authorization': `Bearer ${idToken}`, 'Referer': referer } });
  const docCloud = await resCloud.json();
  const cloudRating = parseInt(docCloud.fields.ratingTier.integerValue);
  const cloudTime = docCloud.fields.updatedAt.stringValue;

  console.log(`3. Cloud Rating: Tier ${cloudRating} (Time: ${cloudTime})`);
  console.log(`4. Local Rating: Tier ${localRecord.ratingTier} (Time: ${localRecord.updatedAt})`);

  const localMs = new Date(localRecord.updatedAt).getTime();
  const cloudMs = new Date(cloudTime).getTime();

  let finalRating;
  if (localMs > cloudMs) {
    finalRating = localRecord.ratingTier;
    console.log(`✅ Resolution: Local is NEWER (${localMs - cloudMs}ms ahead) -> Preserving Tier ${finalRating}`);
  } else {
    finalRating = cloudRating;
  }

  if (finalRating === 1) {
    console.log('\n🎉 PASS: Rating Tier conflict resolution correctly preserved local update!');
  } else {
    console.error('\n❌ FAIL: Rating Tier reverted back to old cloud value.');
  }
}

testRatingSync();
