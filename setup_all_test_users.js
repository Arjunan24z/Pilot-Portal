const { MongoClient } = require('mongodb');

const uri = 'mongodb://pilot-portal-mongodb:27017/pilot_portal';

async function setupAllTestUsers() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('pilot_portal');
    const users = db.collection('users');
    
    // Clear and recreate all test users with proper roles
    await users.deleteMany({});
    console.log('Cleared all users\n');
    
    // Pre-register all test users with correct Cognito Subs and Roles
    const testUsers = [
      {
        email: 'admin@pilot-portal.com',
        name: 'Admin User',
        role: 'admin',
        cognitoSub: '94d8d4c8-a041-7075-7d9f-041f5d9b5216', // From earlier Cognito creation
        createdAt: new Date(),
        lastLogin: null
      },
      {
        email: 'pilot@pilot-portal.com',
        name: 'Pilot User',
        role: 'pilot',
        cognitoSub: 'b4e83408-f0f1-70f4-638d-3975debd3075', // From earlier Cognito creation
        createdAt: new Date(),
        lastLogin: null
      },
      {
        email: 'testadmin@pilot-portal.com',
        name: 'Test Admin',
        role: 'admin', // Pre-register as admin
        cognitoSub: '54c8d498-b031-70d3-fbf6-bcebe757632a', // From their login
        createdAt: new Date(),
        lastLogin: new Date()
      }
    ];
    
    const insertResult = await users.insertMany(testUsers);
    console.log(`Inserted ${insertResult.insertedCount} test users\n`);
    
    // Verify
    const allUsers = await users.find({}).project({ 
      email: 1, 
      name: 1, 
      role: 1, 
      cognitoSub: 1,
      _id: 0 
    }).toArray();
    
    console.log('Database Users Ready for Testing:');
    console.log('==================================');
    allUsers.forEach(u => {
      console.log(`Email: ${u.email}`);
      console.log(`  Name: ${u.name}`);
      console.log(`  Role: ${u.role}`);
      console.log(`  CognitoSub: ${u.cognitoSub}`);
      console.log('');
    });
  } finally {
    await client.close();
  }
}

setupAllTestUsers().catch(console.error);
