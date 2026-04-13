// routes/dashboard.routes.js

const express = require("express");
const router = express.Router();

const { obtenerDashboard, obtenerHistorial } = require("../controllers/dashboard.controller");

router.get("/:usuario_id", obtenerDashboard);
router.get("/historial/:usuario_id", obtenerHistorial);

module.exports = router;