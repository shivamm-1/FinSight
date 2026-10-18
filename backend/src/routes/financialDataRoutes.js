const express = require("express");

const {
  getFinancialData,
  createFinancialData,
  updateFinancialData,
  deleteFinancialData,
} = require("../controllers/financialDataController.js");

const validate = require("../middleware/validate.js");
const authenticate = require("../middleware/authenticate.js");
const authorizeRoles = require("../middleware/authorizeRoles.js");

const {
  financialDataSchema,
} = require("../validators/financialDataValidator.js");

const {
  financialDataUpdateSchema,
} = require("../validators/financialDataUpdateValidator.js");

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("business_owner"));

router.get("/", getFinancialData);

router.post("/", validate(financialDataSchema), createFinancialData);

router.put("/:id", validate(financialDataUpdateSchema), updateFinancialData);

router.delete("/:id", deleteFinancialData);

module.exports = router;
