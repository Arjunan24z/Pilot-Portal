const { MongoClient } = require('mongodb');

const uri = 'mongodb://pilot-portal-mongodb:27017/pilot_portal';

async function fixAdminRole() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('pilot_portal');
    const users = db.collection('users');
    
    // Update any testadmin users to have admin role
    const result = await users.updateOne(
      { email: 'testadmin@pilot-portal.com' },
      { $set: { role: 'admin' } }
    );
    
    console.log(`Updated ${result.modifiedCount} user(s) to admin role\n`);
    
    // Show all users
    const allUsers = await users.find({}).project({ 
      email: 1, 
      name: 1, 
      role: 1, 
      _id: 0 
    }).toArray();
    
    console.log('Database Users:');
    allUsers.forEach(u => {
      console.log(`  Email: ${u.email} | Role: ${u.role}`);
    });
  } finally {
    await client.close();
  }
}

fixAdminRole().catch(console.error);
