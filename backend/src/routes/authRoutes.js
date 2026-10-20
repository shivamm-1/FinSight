const express = require("express");

const { register, login } = require("../controllers/AuthController.js");
const validate = require("../middleware/Validate.js");

const {
  registerSchema,
  loginSchema,
} = require("../validators/AuthValidator.js");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

module.exports = router;
