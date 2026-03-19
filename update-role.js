db.users.updateOne(
  {email: "testadmin@pilot-portal.com", role: "pilot"},
  {$set: {role: "admin"}}
);
db.users.find({email: "testadmin@pilot-portal.com"}).pretty();
