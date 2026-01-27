const mongoose = require("mongoose");

const medicalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  classType: {
    type: String,
    enum: ["Class 1", "Class 2", "Class 3"],
    required: true
  },

  issueDate: Date,
  expiryDate: Date,

  // Medical Examiner Information
  examinerName: String,
  examinerNumber: String, // AME certificate number
  examinationDate: Date,

  // Medical Details
  restrictions: String, // e.g., "Must wear corrective lenses", "Not valid for night flying"
  limitations: String, // Any operational limitations
  
  // Reminder settings
  reminderDays: { type: Number, default: 30 }, // Days before expiry to send reminder
  
  // History tracking
  previousMedicals: [{
    classType: String,
    issueDate: Date,
    expiryDate: Date,
    examinerName: String
  }],

  // 🔑 Document storage
  documentUrl: String,
  documentName: String,

  remarks: String,

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update timestamps
medicalSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("Medical", medicalSchema);
