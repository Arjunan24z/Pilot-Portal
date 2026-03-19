const { MongoClient } = require('mongodb');

const uri = 'mongodb://pilot-portal-mongodb:27017/pilot-portal';

async function cleanAndResetUsers() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('pilot-portal');
    const users = db.collection('users');
    
    // Delete ALL users and start fresh
    const deleteResult = await users.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} users\n`);
    
    // Create fresh test users with correct roles
    const newUsers = [
      {
        email: 'admin@pilot-portal.com',
        name: 'Admin User',
        role: 'admin',
        cognitoSub: '94d8d4c8-a041-7075-7d9f-041f5d9b5216',
        createdAt: new Date(),
        lastLogin: null
      },
      {
        email: 'pilot@pilot-portal.com',
        name: 'Pilot User',
        role: 'pilot',
        cognitoSub: 'b4e83408-f0f1-70f4-638d-3975debd3075',
        createdAt: new Date(),
        lastLogin: null
      },
      {
        email: 'testadmin@pilot-portal.com',
        name: 'Test Admin',
        role: 'admin',
        cognitoSub: '54c8d498-b031-70d3-fbf6-bcebe757632a',
        createdAt: new Date(),
        lastLogin: null
      }
    ];
    
    const insertResult = await users.insertMany(newUsers);
    console.log(`Inserted ${insertResult.insertedCount} fresh test users\n`);
    
    console.log('Updated User List:');
    console.log('==================');
    const allUsers = await users.find({}).project({
      email: 1,
      name: 1,
      role: 1,
      _id: 1
    }).toArray();
    
    allUsers.forEach((u, idx) => {
      console.log(`[${idx + 1}] ${u.email} | Role: ${u.role} | ID: ${u._id}`);
    });
    
  } finally {
    await client.close();
  }
}

cleanAndResetUsers().catch(console.error);
