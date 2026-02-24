const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// GENERAR READING
exports.generarReading = async (req, res) => {
  try {

    const { tema, nivel } = req.body;

    if (!tema || !nivel) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const prompt = `
Genera un ejercicio de READING en inglés para nivel ${nivel} sobre el tema "${tema}".

Responde SOLO con JSON válido.
NO uses \`\`\`json ni \`\`\`
NO agregues texto extra.

Formato EXACTO:

{
  "tipo": "opcion_multiple",
  "texto": "Texto de lectura aquí",
  "preguntas": [
    {
      "pregunta": "Pregunta 1",
      "opciones": ["A", "B", "C"],
      "correcta": "B"
    }
  ]
}

O:

{
  "tipo": "completar",
  "texto": "Texto con ____ para completar",
  "respuestas": ["palabra1", "palabra2"]
}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    let contenido = response.output[0].content[0].text;

    // LIMPIAR JSON
    contenido = contenido
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const ejercicio = JSON.parse(contenido);

    res.json(ejercicio);

  } catch (error) {

    console.error("Error Reading:", error);

    res.status(500).json({
      error: "Error generando reading"
    });

  }
};

// CALIFICAR READING 
exports.calificarReading = async (req, res) => {

  try {

    const { ejercicio, respuestaUsuario } = req.body;

    if (!ejercicio || !respuestaUsuario) {
      return res.status(400).json({
        error: "Faltan datos para calificar"
      });
    }

    let correctas = 0;
    let detalle = [];

    // OPCION MULTIPLE
    if (ejercicio.tipo === "opcion_multiple") {

      ejercicio.preguntas.forEach((pregunta, index) => {

        const correcta =
          pregunta.correcta.trim().toLowerCase();

        const usuario =
          (respuestaUsuario[index] || "")
          .trim()
          .toLowerCase();

        const esCorrecta = correcta === usuario;

        detalle.push(esCorrecta);

        if (esCorrecta) correctas++;

      });

    }

    // COMPLETAR
    if (ejercicio.tipo === "completar") {

      ejercicio.respuestas.forEach((respuesta, index) => {

        const correcta =
          respuesta.trim().toLowerCase();

        const usuario =
          (respuestaUsuario[index] || "")
          .trim()
          .toLowerCase();

        const esCorrecta = correcta === usuario;

        detalle.push(esCorrecta);

        if (esCorrecta) correctas++;

      });

    }

    const total = detalle.length;
    const score = Math.round((correctas / total) * 100);

    // IA SOLO PARA FEEDBACK
    const promptFeedback = `
You are an English teacher.

Reading level: ${ejercicio.nivel || "unknown"}

Score: ${score}/100

Correct answers: ${correctas}
Total questions: ${total}

Student answers:
${JSON.stringify(respuestaUsuario)}

Correct answers:
${
  ejercicio.tipo === "opcion_multiple"
    ? JSON.stringify(ejercicio.preguntas.map(p => p.correcta))
    : JSON.stringify(ejercicio.respuestas)
}

Write short professional feedback (max 2 sentences).
Be encouraging and helpful.
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: promptFeedback
    });

    let feedback = response.output[0].content[0].text.trim();

    res.json({
      score,
      correcto: score >= 70,
      feedback,
      detalle
    });

  } catch (error) {

    console.error("Error al calificar reading:", error);

    res.status(500).json({
      error: "Error al calificar reading"
    });

  }

};