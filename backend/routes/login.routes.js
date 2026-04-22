const express = require("express");
const router = express.Router();

const loginController = require("../controllers/login.controller");

// LOGIN
router.post("/", loginController.login);

// FORGOT PASSWORD
router.post("/forgot-password", loginController.forgotPassword);

// RESET PASSWORD
router.post("/reset-password", loginController.resetPassword);

module.exports = router;