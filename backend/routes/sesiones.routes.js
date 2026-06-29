const express = require("express");
const router = express.Router();
const sesionesController = require("../controllers/sesiones.controller");

// POST /api/sesiones — Guarda una sesión de práctica del usuario
router.post("/", sesionesController.guardarSesion);

module.exports = router;