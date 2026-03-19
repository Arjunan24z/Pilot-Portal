const License = require("../models/license.model");

exports.createLicense = async (req, res) => {
  const existing = await License.findOne({
    userId: req.user.userId,
    type: req.body.type
  });

  if (existing) {
    return res.status(400).json({
      message: `${req.body.type} license already exists. Please renew instead.`
    });
  }

  try {
    const license = await License.create({
      userId: req.user.userId,
      ...req.body,

      documentUrl: req.file
        ? `${req.protocol}://${req.get("host")}/uploads/licenses/${req.file.filename}`
        : null,

      documentName: req.file?.originalname
    });

    res.status(201).json(license);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getLicenses = async (req, res) => {
  try {
    // Admins can see all licenses, pilots only see their own
    const query = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const licenses = await License.find(query).populate('userId', 'name email role');
    
    res.json({
      message: "Licenses retrieved successfully",
      count: licenses.length,
      viewMode: req.user.role === 'admin' ? 'all licenses (admin)' : 'own licenses (pilot)',
      data: licenses
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateLicense = async (req, res) => {
  try {
    // SECURITY: Verify ownership before updating
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ message: "License not found" });
    }

    // Check if license belongs to authenticated user
    if (license.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "You don't have permission to update this license" });
    }

    const update = {
      ...req.body
    };

    if (req.file) {
      update.documentUrl = `${req.protocol}://${req.get("host")}/uploads/licenses/${req.file.filename}`;
      update.documentName = req.file.originalname;
    }

    const updatedLicense = await License.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    res.json(updatedLicense);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.deleteLicense = async (req, res) => {
  try {
    // SECURITY: Verify ownership before deleting
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ message: "License not found" });
    }

    // Check if license belongs to authenticated user
    if (license.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "You don't have permission to delete this license" });
    }

    await License.findByIdAndDelete(req.params.id);
    res.json({ message: "License deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add endorsement to license
exports.addEndorsement = async (req, res) => {
  try {
    const license = await License.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!license) {
      return res.status(404).json({ message: "License not found" });
    }

    const endorsement = {
      endorsementType: req.body.endorsementType,
      instructorName: req.body.instructorName,
      instructorCertificate: req.body.instructorCertificate,
      date: req.body.date || new Date(),
      aircraftType: req.body.aircraftType,
      remarks: req.body.remarks
    };

    license.endorsements.push(endorsement);
    license.updatedAt = Date.now();
    await license.save();

    res.json(license);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add rating to license
exports.addRating = async (req, res) => {
  try {
    const license = await License.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!license) {
      return res.status(404).json({ message: "License not found" });
    }

    const rating = req.body.rating;
    if (!license.ratings.includes(rating)) {
      license.ratings.push(rating);
      license.updatedAt = Date.now();
      await license.save();
    }

    res.json(license);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Remove endorsement
exports.removeEndorsement = async (req, res) => {
  try {
    const license = await License.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!license) {
      return res.status(404).json({ message: "License not found" });
    }

    license.endorsements.id(req.params.endorsementId).remove();
    license.updatedAt = Date.now();
    await license.save();

    res.json(license);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
