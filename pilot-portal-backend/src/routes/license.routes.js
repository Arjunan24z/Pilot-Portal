const express = require("express");
const auth = require("../middleware/auth.middleware");
const upload = require("../middleware/license.middleware");

const {
  createLicense,
  getLicenses,
  updateLicense,
  deleteLicense,
  addEndorsement,
  addRating,
  removeEndorsement
} = require("../controllers/license.controller");

const router = express.Router();

// License CRUD
router.post(
  "/",
  auth,
  upload.single("document"),
  createLicense
);

router.put(
  "/:id",
  auth,
  upload.single("document"),
  updateLicense
);

router.get("/", auth, getLicenses);
router.delete("/:id", auth, deleteLicense);

// Endorsements and Ratings
router.post("/:id/endorsements", auth, addEndorsement);
router.post("/:id/ratings", auth, addRating);
router.delete("/:id/endorsements/:endorsementId", auth, removeEndorsement);

module.exports = router;
