const express = require("express");
const router = express.Router();

const loginController = require("../controllers/login.controller");

// LOGIN
router.post("/", loginController.login);

// FORGOT PASSWORD & RESET PASSWORD — DESACTIVADOS
// El envío del correo de recuperación ahora lo gestiona
// Firebase Auth directamente desde el cliente (sendPasswordResetEmail).
// router.post("/forgot-password", loginController.forgotPassword);
// router.post("/reset-password",  loginController.resetPassword);

module.exports = router;