const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  
  // AWS Cognito integration
  cognitoSub: String, // Cognito user ID
  
  // Role-based access control
  role: {
    type: String,
    enum: ['admin', 'pilot'],
    default: 'pilot'
  },

  // Tracking
  accessStart: Date,
  accessEnd: Date,
  lastLogin: Date,
  
  createdAt: { type: Date, default: Date.now }
});

// Hash password
// Remove next() from async middleware
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidate) {
  return await bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
