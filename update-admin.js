const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://localhost:27017/pilot_portal';

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    
    // Update the old pilot user to admin
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId('69bbf7515cc465bd475ec8b3') },
      { $set: { role: 'admin' } }
    );
    
    console.log('Update result:', result);
    
    // Verify
    const user = await db.collection('users').findOne({ _id: new ObjectId('69bbf7515cc465bd475ec8b3') });
    console.log('Updated user:', user);
    
  } finally {
    await client.close();
  }
})();
