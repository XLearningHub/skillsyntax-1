const express = require("express");
const router = express.Router();

// Generar ejercicio de Reading
router.post("/", (req, res) => {
  const { tema = "general", nivel = "A1" } = req.body;

  // Texto dinámico basado en el tema y nivel
  const texto = `
${tema.charAt(0).toUpperCase() + tema.slice(1)} is an important topic in everyday life.
At the ${nivel} level, learners begin to understand basic vocabulary related to ${tema}.
Studying ${tema} helps people communicate better and expand their knowledge in real-world situations.
  `.trim();

  // Preguntas generadas a partir del texto
  const preguntas = [
    {
      pregunta: `What is the main topic of the text?`,
      opciones: [
        tema,
        "Technology",
        "Education",
        "Health"
      ],
      respuesta_correcta: tema
    },
    {
      pregunta: `What level is mentioned in the text?`,
      opciones: [
        nivel,
        "B2",
        "C1",
        "A2"
      ],
      respuesta_correcta: nivel
    },
    {
      pregunta: `What is one benefit of studying ${tema}?`,
      opciones: [
        "Improving communication skills",
        "Cooking better meals",
        "Driving faster",
        "Building machines"
      ],
      respuesta_correcta: "Improving communication skills"
    }
  ];

  res.json({
    texto,
    preguntas
  });
});

// Calificar ejercicio de Reading (SIN CAMBIOS)
router.post("/calificar", (req, res) => {
  const { ejercicio, respuestaUsuario } = req.body;

  let correctas = 0;
  const total = ejercicio.preguntas.length;

  ejercicio.preguntas.forEach((pregunta, index) => {
    if (respuestaUsuario[index] === pregunta.respuesta_correcta) {
      correctas++;
    }
  });

  const score = Math.round((correctas / total) * 100);

  res.json({
    score,
    feedback:
      score === 100
        ? "¡Excelente trabajo!"
        : "Sigue practicando para mejorar."
  });
});

module.exports = router;