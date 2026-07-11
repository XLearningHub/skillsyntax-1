const express = require("express");
const router = express.Router();

const writingController =
require("../controllers/writing.controller");


// GENERAR WRITING (fill-in-the-blanks)
router.post("/",
writingController.generarWriting);


// CALIFICAR WRITING (fill-in-the-blanks)
router.post("/calificar",
writingController.calificarWriting);


// GENERAR PROMPT DE EXAMEN (Writing Task Instruction)
router.post("/generate-prompt",
writingController.generateWritingPrompt);


// EVALUAR REDACCIÓN LIBRE (free writing)
router.post("/evaluate",
writingController.evaluateWriting);


module.exports = router;