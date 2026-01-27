// license.model.js
const mongoose = require("mongoose");

const licenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  type: {
    type: String,
    enum: ["SPL", "PPL", "CPL", "AIPL"],
    required: true
  },

  issueDate: Date,
  expiryDate: Date,
  licenseNumber: String,
  remarks: String,

  // Ratings and endorsements
  ratings: [{
    type: String,
    // e.g., "Instrument Rating", "Multi-Engine", "Seaplane", etc.
  }],
  
  endorsements: [{
    endorsementType: String, // e.g., "High Performance", "Complex Aircraft", "Tailwheel"
    instructorName: String,
    instructorCertificate: String,
    date: Date,
    aircraftType: String,
    remarks: String
  }],

  // Restrictions
  restrictions: String, // e.g., "Must wear corrective lenses"

  // ✅ NEW
  documentUrl: String,
  documentName: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("License", licenseSchema);
