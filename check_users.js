const { MongoClient } = require('mongodb');

const uri = 'mongodb://pilot-portal-mongodb:27017/pilot_portal';

async function checkUsers() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('pilot_portal');
    const users = db.collection('users');
    
    console.log('All users in database:\n');
    const allUsers = await users.find({}).toArray();
    
    allUsers.forEach((user, idx) => {
      console.log(`[${idx + 1}] Email: ${user.email}`);
      console.log(`    Name: ${user.name}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    CognitoSub: ${user.cognitoSub}`);
      console.log(`    ID: ${user._id}`);
      console.log('');
    });
    
    if (allUsers.length === 0) {
      console.log('No users found!');
    }
  } finally {
    await client.close();
  }
}

checkUsers().catch(console.error);
