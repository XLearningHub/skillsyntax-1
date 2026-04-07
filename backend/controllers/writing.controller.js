const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// =======================
// GENERAR WRITING
// =======================
exports.generarWriting = async (req, res) => {
  try {

    const tema = req.body.tema || req.body.topic || "daily life";
    const nivel = req.body.nivel || "A1";

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
- EXACTAMENTE 8 espacios (____)
- vocabulario acorde al nivel ${nivel}
- tema relacionado con ${tema}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "Eres un generador de ejercicios de inglés. Respondes SOLO JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    });

    let contenido = response.choices?.[0]?.message?.content;

    if (!contenido) {
      console.log("Respuesta completa:", response);
      return res.status(500).json({
        error: "No se generó contenido"
      });
    }

    console.log("RESPUESTA IA:", contenido);

    // limpiar posibles ```json
    contenido = contenido
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let ejercicio;

    try {
      ejercicio = JSON.parse(contenido);
    } catch (parseError) {
      console.error("Error parseando JSON:", parseError);
      console.log("Contenido recibido:", contenido);

      return res.status(500).json({
        error: "La IA no devolvió JSON válido"
      });
    }

    ejercicio.nivel = nivel;

    res.json(ejercicio);

  } catch (error) {
    console.error("Error Writing:", error);

    res.status(500).json({
      error: "Error generando writing"
    });
  }
};



// =======================
// CALIFICAR WRITING
// =======================
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

    const respuestasCorrectas = ejercicio.respuestas || [];
    const respuestasUsuario = respuestaUsuario || [];

    // usamos el mínimo para evitar errores
    const total = Math.min(respuestasCorrectas.length, respuestasUsuario.length);

    for (let i = 0; i < total; i++) {

      const correcta = (respuestasCorrectas[i] || "")
      .trim()
      .toLowerCase();

    const usuario = (respuestasUsuario[i] || "")
    .trim()
    .toLowerCase();

    const esCorrecta = correcta === usuario;

      detalle.push({
      correcta,
      usuario,
      esCorrecta
    });

    if (esCorrecta) correctas++;
  }

  // evitar división por 0
    const score = total > 0
      ? Math.round((correctas / total) * 100)
      : 0;

    // =======================
    // FEEDBACK CON IA
    // =======================
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

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are a helpful English teacher." },
        { role: "user", content: promptFeedback }
      ]
    });

    const feedback =
      response.choices?.[0]?.message?.content?.trim() || "Good job!";

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