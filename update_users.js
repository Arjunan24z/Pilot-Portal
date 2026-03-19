const { MongoClient } = require('mongodb');

const uri = 'mongodb://pilot-portal-mongodb:27017/pilot_portal';

async function updateUsers() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('pilot_portal');
    const users = db.collection('users');
    
    const passwordHash = '$2b$10$ROfp.ia3cv.1pSHf2m75Kup/Q.WQpduUn.4pCsjlzRXoopXzdycuO';
    
    const result = await users.updateMany({}, { $set: { password: passwordHash } });
    console.log(`Updated ${result.modifiedCount} users with password`);
    
    const allUsers = await users.find({}, { projection: { email: 1, role: 1, _id: 0 } }).toArray();
    console.log('\nTest Users Created:');
    allUsers.forEach(u => console.log(`  Email: ${u.email} | Role: ${u.role}`));
  } finally {
    await client.close();
  }
}

updateUsers().catch(console.error);
