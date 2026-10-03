const express = require("express");

const {
  getBusinessProfile,
  createBusinessProfile,
  updateBusinessProfile,
} = require("../controllers/BusinessProfileController");

const validate = require("../middleware/validate");
const {
  businessProfileSchema,
} = require("../validators/BusinessProfileValidator");

const router = express.Router();

router.get("/", getBusinessProfile);

router.post("/", validate(businessProfileSchema), createBusinessProfile);

router.put("/:id", validate(businessProfileSchema), updateBusinessProfile);

module.exports = router;
