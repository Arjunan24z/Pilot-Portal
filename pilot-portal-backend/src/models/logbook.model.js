const mongoose = require("mongoose");

const logbookSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  // Flight Date & Basic Info
  date: { type: Date, required: true },
  aircraft: { type: String, required: true }, // Aircraft type (e.g., "Cessna 172")
  aircraftRegistration: { type: String }, // Tail number (e.g., "N12345")
  
  // Route Information
  departureAirport: { type: String }, // ICAO code (e.g., "KJFK")
  arrivalAirport: { type: String }, // ICAO code (e.g., "KLAX")
  route: { type: String }, // Route flown
  
  // Time Breakdown (in hours)
  totalTime: { type: Number, default: 0 }, // Total flight time
  pilotInCommand: { type: Number, default: 0 }, // PIC time
  secondInCommand: { type: Number, default: 0 }, // SIC time
  dualReceived: { type: Number, default: 0 }, // Dual instruction received
  dualGiven: { type: Number, default: 0 }, // Dual instruction given
  soloTime: { type: Number, default: 0 }, // Solo time
  crossCountry: { type: Number, default: 0 }, // Cross-country time (>50nm)
  nightTime: { type: Number, default: 0 }, // Night time
  instrumentActual: { type: Number, default: 0 }, // Actual instrument
  instrumentSimulated: { type: Number, default: 0 }, // Simulated instrument
  
  // Operations & Landings
  dayLandings: { type: Number, default: 0 }, // Day landings
  nightLandings: { type: Number, default: 0 }, // Night landings
  
  // Flight Type
  flightType: { 
    type: String, 
    enum: ["Training", "Personal", "Commercial", "Other"],
    default: "Personal"
  },
  
  // Instructor Information (if dual)
  instructorName: { type: String },
  instructorSignature: { type: String },
  
  // Legacy field for backward compatibility
  hours: { type: Number }, // Will map to totalTime if present
  
  // Notes
  remarks: { type: String },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

logbookSchema.index({ userId: 1, date: -1 });
logbookSchema.index({ userId: 1, dayLandings: 1, date: -1 });
logbookSchema.index({ userId: 1, nightLandings: 1, date: -1 });
logbookSchema.index({ userId: 1, instrumentActual: 1, instrumentSimulated: 1, date: -1 });

// Pre-save hook to sync legacy 'hours' field with 'totalTime'
logbookSchema.pre('save', function() {
  // If hours is provided but totalTime isn't, use hours for totalTime
  if (this.hours && !this.totalTime) {
    this.totalTime = this.hours;
  }
  // Always sync hours with totalTime for backward compatibility
  if (this.totalTime) {
    this.hours = this.totalTime;
  }
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("Logbook", logbookSchema);
