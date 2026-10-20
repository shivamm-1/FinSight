const express = require("express");

const {
  getBusinessProfile,
  createBusinessProfile,
  updateBusinessProfile,
} = require("../controllers/BusinessProfileController.js");

const validate = require("../middleware/Validate.js");
const authenticate = require("../middleware/Authenticate.js");
const authorizeRoles = require("../middleware/AuthorizeRoles.js");

const {
  businessProfileSchema,
} = require("../validators/BusinessProfileValidator.js");

const {
  businessProfileUpdateSchema,
} = require("../validators/BusinessProfileUpdateValidator.js");

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
