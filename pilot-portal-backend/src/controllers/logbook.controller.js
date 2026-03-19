const Logbook = require("../models/logbook.model");

exports.createEntry = async (req, res) => {
  try {
    console.log("[Logbook] Creating entry for user:", req.user.userId, "Role:", req.user.role);
    console.log("[Logbook] Raw request body:", JSON.stringify(req.body));
    
    // Validate required fields
    if (!req.body.date) {
      return res.status(400).json({ message: "Date is required" });
    }
    if (!req.body.aircraft) {
      return res.status(400).json({ message: "Aircraft is required" });
    }
    
    // Prepare entry data
    const entryData = {
      userId: req.user.userId,
      date: new Date(req.body.date), // Convert to Date object
      aircraft: req.body.aircraft,
      aircraftRegistration: req.body.aircraftRegistration || undefined,
      departureAirport: req.body.departureAirport || undefined,
      arrivalAirport: req.body.arrivalAirport || undefined,
      route: req.body.route || undefined,
      totalTime: req.body.totalTime || 0,
      pilotInCommand: req.body.pilotInCommand || 0,
      secondInCommand: req.body.secondInCommand || 0,
      dualReceived: req.body.dualReceived || 0,
      dualGiven: req.body.dualGiven || 0,
      soloTime: req.body.soloTime || 0,
      crossCountry: req.body.crossCountry || 0,
      nightTime: req.body.nightTime || 0,
      instrumentActual: req.body.instrumentActual || 0,
      instrumentSimulated: req.body.instrumentSimulated || 0,
      dayLandings: req.body.dayLandings || 0,
      nightLandings: req.body.nightLandings || 0,
      flightType: req.body.flightType || undefined,
      instructorName: req.body.instructorName || undefined,
      remarks: req.body.remarks || undefined
    };
    
    console.log("[Logbook] Prepared entry data:", JSON.stringify(entryData));
    
    const entry = await Logbook.create(entryData);

    console.log("[Logbook] Entry created successfully:", entry._id);
    res.status(201).json(entry);
  } catch (error) {
    console.error("[Logbook] Error creating entry:", error.message);
    console.error("[Logbook] Error name:", error.name);
    console.error("[Logbook] Error stack:", error.stack);
    if (error.errors) {
      console.error("[Logbook] Validation errors:", error.errors);
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getEntries = async (req, res) => {
  try {
    // Admins can see all entries, pilots only see their own
    const query = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const entries = await Logbook.find(query).populate('userId', 'name email role');
    
    res.json({
      message: "Logbook entries retrieved successfully",
      count: entries.length,
      viewMode: req.user.role === 'admin' ? 'all entries (admin)' : 'own entries (pilot)',
      data: entries
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateEntry = async (req, res) => {
  try {
    // SECURITY: Verify ownership before updating
    const entry = await Logbook.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Logbook entry not found" });
    }

    // Check if entry belongs to authenticated user
    if (entry.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "You don't have permission to update this entry" });
    }

    const updatedEntry = await Logbook.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    // SECURITY: Verify ownership before deleting
    const entry = await Logbook.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Logbook entry not found" });
    }

    // Check if entry belongs to authenticated user
    if (entry.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "You don't have permission to delete this entry" });
    }

    await Logbook.findByIdAndDelete(req.params.id);
    res.json({ message: "Logbook entry deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
