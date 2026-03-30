const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// GENERAR WRITING
exports.generarWriting = async (req, res) => {

  try {

    const { tema, nivel } = req.body;

    if (!tema || !nivel) {
      return res.status(400).json({
        error: "Faltan datos"
      });
    }

    const prompt = `
Genera un ejercicio de WRITING en inglés
nivel ${nivel} sobre el tema "${tema}".

Responde SOLO con JSON válido.
NO uses \`\`\`json ni \`\`\`
NO agregues texto extra.

Formato EXACTO:

{
  "tipo":"fill_blanks",
  "texto":"Texto con ____ espacios para completar",
  "palabras":["word1","word2","word3","word4","word5","word6","word7","word8"],
  "respuestas":["correct1","correct2","correct3","correct4","correct5","correct6","correct7","correct8"]
}

Reglas:
- Usa inglés natural
- 8 espacios para completar
- vocabulario acorde al nivel ${nivel}
- tema relacionado con ${tema}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    let contenido = response.output[0].content[0].text;

    contenido = contenido
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const ejercicio = JSON.parse(contenido);

    ejercicio.nivel = nivel;

    res.json(ejercicio);

  } catch (error) {

    console.error("Error Writing:", error);

    res.status(500).json({
      error: "Error generando writing"
    });

  }

};



// CALIFICAR WRITING
exports.calificarWriting = async (req, res) => {

  try {

    const { ejercicio, respuestaUsuario } = req.body;

    if (!ejercicio || !respuestaUsuario) {
      return res.status(400).json({
        error: "Faltan datos para calificar"
      });
    }

    let correctas = 0;
    let detalle = [];

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

    const total = ejercicio.respuestas.length;

    const score =
      Math.round((correctas / total) * 100);


    // FEEDBACK CON IA
    const promptFeedback = `
You are an English teacher.

Writing level: ${ejercicio.nivel}

Score: ${score}/100

Correct answers: ${correctas}
Total blanks: ${total}

Student answers:
${JSON.stringify(respuestaUsuario)}

Correct answers:
${JSON.stringify(ejercicio.respuestas)}

Write short professional feedback (max 2 sentences).
Be encouraging and helpful.
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: promptFeedback
    });

    const feedback =
      response.output[0].content[0].text.trim();

    res.json({
      score,
      correcto: score >= 70,
      feedback,
      detalle
    });

  } catch (error) {

    console.error("Error calificar writing:", error);

    res.status(500).json({
      error: "Error al calificar writing"
    });

  }

};