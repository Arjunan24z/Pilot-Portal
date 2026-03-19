db.users.updateOne({email: 'testadmin@pilot-portal.com'}, {$unset: {cognitoSub: ''}});
db.users.findOne({email: 'testadmin@pilot-portal.com'});
