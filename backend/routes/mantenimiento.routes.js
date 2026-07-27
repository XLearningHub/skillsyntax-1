// routes/mantenimiento.routes.js
// ⚠️  RUTA TEMPORAL — deshabilitar en index.js tras ejecutar la migración.

const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/mantenimiento.controller");

// GET /api/mantenimiento/asignar-id-num
// Asigna id_num secuencial a usuarios y grupos que no lo tengan.
// Ejecutar UNA SOLA VEZ y luego deshabilitar.
router.get("/asignar-id-num", ctrl.asignarIdNum);

module.exports = router;
