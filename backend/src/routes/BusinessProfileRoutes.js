const express = require("express");

const {
  getBusinessProfile,
  createBusinessProfile,
  updateBusinessProfile,
} = require("../controllers/businessProfileController.js");

const validate = require("../middleware/validate.js");
const authenticate = require("../middleware/authenticate.js");
const authorizeRoles = require("../middleware/authorizeRoles.js");

const {
  businessProfileSchema,
} = require("../validators/businessProfileValidator.js");

const {
  businessProfileUpdateSchema,
} = require("../validators/businessProfileUpdateValidator.js");

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("business_owner"));

router.get("/", getBusinessProfile);

router.post("/", validate(businessProfileSchema), createBusinessProfile);

router.put(
  "/:id",
  validate(businessProfileUpdateSchema),
  updateBusinessProfile,
);

module.exports = router;
