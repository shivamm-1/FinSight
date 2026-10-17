const express = require("express");

const { register, login } = require("../controllers/authController.js");
const validate = require("../middleware/validate.js");

const {
  registerSchema,
  loginSchema,
} = require("../validators/authValidator.js");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

module.exports = router;
