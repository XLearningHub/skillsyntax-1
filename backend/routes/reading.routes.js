const express = require("express");
const router = express.Router();
const readingController = require("../controllers/reading.controller");


router.post("/", readingController.generarReading);


router.post("/calificar", async (req, res) => { 
    try {
        const { ejercicio, respuestaUsuario } = req.body;

        if (!ejercicio || !ejercicio.preguntas || !respuestaUsuario) {
            return res.status(400).json({ 
                error: "Missing data for grading",
                score: 0 
            });
        }

        let correctasCount = 0;
        const preguntas = ejercicio.preguntas;
        
        const soluciones = preguntas.map(p => p.respuesta_correcta || p.correcta);

        preguntas.forEach((pregunta, index) => {
            const resCorrecta = pregunta.respuesta_correcta || pregunta.correcta;
            if (respuestaUsuario[index] && respuestaUsuario[index].trim() === resCorrecta.trim()) {
                correctasCount++;
            }
        });

        const total = preguntas.length;
        const score = Math.round((correctasCount / total) * 100);

        const feedbackIA = await readingController.generarFeedbackIA(ejercicio, respuestaUsuario, score);

        res.json({
            score,
            feedback: feedbackIA,
            correctas: soluciones 
        });

    } catch (error) {
        console.error("Error grading reading:", error);
        res.status(500).json({ error: "Internal server error during grading" });
    }
});

module.exports = router;