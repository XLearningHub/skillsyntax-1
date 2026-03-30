const express = require("express");
const router = express.Router();

const writingController =
require("../controllers/writing.controller");


// GENERAR WRITING
router.post("/",
writingController.generarWriting);


// CALIFICAR WRITING
router.post("/calificar",
writingController.calificarWriting);


module.exports = router;