const { MongoClient } = require('mongodb');

const uri = 'mongodb://pilot-portal-mongodb:27017/pilot_portal';

async function addCognitoUsers() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('pilot_portal');
    const users = db.collection('users');
    
    // Delete old test users
    const deleteResult = await users.deleteMany({ 
      email: { $in: ['admin@test.com', 'pilot@test.com'] }
    });
    console.log(`Deleted ${deleteResult.deletedCount} old test users`);
    
    // Add Cognito users with their cognitoSub
    const cognitoUsers = [
      {
        email: 'admin@pilot-portal.com',
        name: 'Admin User',
        role: 'admin',
        cognitoSub: '94d8d4c8-a041-7075-7d9f-041f5d9b5216', // From Cognito
        createdAt: new Date(),
        lastLogin: null
      },
      {
        email: 'pilot@pilot-portal.com',
        name: 'Pilot User',
        role: 'pilot',
        cognitoSub: 'b4e83408-f0f1-70f4-638d-3975debd3075', // From Cognito
        createdAt: new Date(),
        lastLogin: null
      }
    ];
    
    const insertResult = await users.insertMany(cognitoUsers);
    console.log(`\nInserted ${insertResult.insertedCount} Cognito users\n`);
    
    // Verify
    const allUsers = await users.find({}).project({ 
      email: 1, 
      name: 1, 
      role: 1, 
      cognitoSub: 1,
      _id: 0 
    }).toArray();
    
    console.log('Database Users:');
    allUsers.forEach(u => {
      console.log(`  Email: ${u.email}`);
      console.log(`    Name: ${u.name}`);
      console.log(`    Role: ${u.role}`);
      console.log(`    CognitoSub: ${u.cognitoSub}`);
      console.log('');
    });
  } finally {
    await client.close();
  }
}

addCognitoUsers().catch(console.error);
