const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  console.log('Querying appointments...');
  const snapshot = await db.collection('appointments').get();
  console.log(`Total appointments found: ${snapshot.size}`);
  
  const docs = [];
  snapshot.forEach(doc => {
    docs.push({ id: doc.id, ...doc.data() });
  });

  // Sort by createdAt descending
  docs.sort((a, b) => {
    const aTime = a.createdAt ? a.createdAt.toDate().getTime() : 0;
    const bTime = b.createdAt ? b.createdAt.toDate().getTime() : 0;
    return bTime - aTime;
  });

  // Print the 5 most recent appointments
  docs.slice(0, 5).forEach(data => {
    console.log(`- Appointment [ID: ${data.id}]:`);
    console.log(`  User Email: ${data.userEmail}`);
    console.log(`  Date: ${data.date ? data.date.toDate().toISOString() : 'N/A'}`);
    console.log(`  Time: ${data.startTime} - ${data.endTime}`);
    console.log(`  Created At: ${data.createdAt ? data.createdAt.toDate().toISOString() : 'N/A'}`);
    console.log(`  Google Calendar Event ID: ${data.googleCalendarEventId || 'NONE'}`);
    console.log(`  Synced: ${data.calendarSynced || 'false'}`);
    console.log('----------------------------------------------------');
  });
}

run().catch(console.error);
