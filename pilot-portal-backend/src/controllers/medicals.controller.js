const Medical = require("../models/medicals.model");

exports.createMedical = async (req, res) => {
  try {
    const existing = await Medical.findOne({
      userId: req.user.userId,
      classType: req.body.classType
    });

    if (existing) {
      return res.status(400).json({
        message: `${req.body.classType} medical already exists. Please renew instead.`
      });
    }

    const medical = await Medical.create({
      userId: req.user.userId,
      classType: req.body.classType,
      issueDate: req.body.issueDate,
      expiryDate: req.body.expiryDate,
      remarks: req.body.remarks,
      documentName: req.file?.originalname,
      documentUrl: req.file
        ? `/uploads/medicals/${req.file.filename}`
        : undefined
    });

    res.status(201).json(medical);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getMedicals = async (req, res) => {
  try {
    // Admins can see all medicals, pilots only see their own
    const query = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const medicals = await Medical.find(query).populate('userId', 'name email role');
    
    res.json({
      message: "Medical records retrieved successfully",
      count: medicals.length,
      viewMode: req.user.role === 'admin' ? 'all records (admin)' : 'own records (pilot)',
      data: medicals
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateMedical = async (req, res) => {
  try {
    // SECURITY: Verify ownership before updating
    const medical = await Medical.findById(req.params.id);
    if (!medical) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    // Check if medical record belongs to authenticated user
    if (medical.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "You don't have permission to update this medical record" });
    }

    const update = {
      issueDate: req.body.issueDate,
      expiryDate: req.body.expiryDate,
      remarks: req.body.remarks
    };

    if (req.file) {
      update.documentName = req.file.originalname;
      update.documentUrl = `/uploads/medicals/${req.file.filename}`;
    }

    const updatedMedical = await Medical.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    res.json(updatedMedical);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.deleteMedical = async (req, res) => {
  try {
    // SECURITY: Verify ownership before deleting
    const medical = await Medical.findById(req.params.id);
    if (!medical) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    // Check if medical record belongs to authenticated user
    if (medical.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "You don't have permission to delete this medical record" });
    }

    await Medical.findByIdAndDelete(req.params.id);
    res.json({ message: "Medical deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
