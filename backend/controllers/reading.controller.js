const OpenAI = require("openai");
require("dotenv").config();
const db = require("../db"); // ✅ IMPORTANTE

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// =======================
// GENERAR READING
// =======================
exports.generarReading = async (req, res) => {
  try {
    let tema = req.body.tema || "daily life";
    const nivel = req.body.nivel || "A1";

    // 🔥 LIMPIEZA DEL TEMA (CLAVE)
    tema = tema.toLowerCase()
      .replace(/generame una leccion de/gi, "")
      .replace(/genera una leccion de/gi, "")
      .replace(/quiero aprender/gi, "")
      .replace(/hazme una leccion de/gi, "")
      .trim();

    // 🔥 PROMPT CORREGIDO (ESTA ES LA MAGIA)
    const prompt = `
Create a natural English reading paragraph.

Level: ${nivel}
Topic: ${tema}

STRICT RULES:
- Do NOT start with "${tema} is an important topic"
- Do NOT repeat the topic word many times
- Do NOT sound like a definition
- Write like a real situation (person, job, daily life, story)
- Use simple English based on level ${nivel}
- 4 to 6 sentences ONLY

Then create 2 comprehension questions.

Return ONLY valid JSON:

{
  "tipo": "reading",
  "texto": "Natural paragraph with a real-life situation",
  "preguntas": [
    {
      "pregunta": "Question 1",
      "opciones": ["Correct answer", "Wrong answer", "Wrong answer"],
      "correcta": "Correct answer"
    },
    {
      "pregunta": "Question 2",
      "opciones": ["Correct answer", "Wrong answer", "Wrong answer"],
      "correcta": "Correct answer"
    }
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You generate English reading exercises. NEVER explain topics. ALWAYS create real-life paragraphs. Return ONLY JSON."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });

    let contenido = response.choices?.[0]?.message?.content?.trim();

    if (!contenido) {
      return res.status(500).json({ error: "No se generó contenido" });
    }

    contenido = contenido.replace(/```json/g, "").replace(/```/g, "").trim();

    let ejercicio;
    try {
      ejercicio = JSON.parse(contenido);
    } catch (err) {
      console.log("❌ ERROR JSON:", contenido);
      return res.status(500).json({ error: "JSON inválido de la IA" });
    }

    ejercicio.nivel = nivel;

    res.json(ejercicio);

  } catch (error) {
    console.error("❌ Error Generar Reading:", error);
    res.status(500).json({ error: "Error generando reading" });
  }
};

// =======================
// CALIFICAR READING
// =======================
exports.calificarReading = async (req, res) => {
  try {
    const { ejercicio, respuestaUsuario } = req.body;

    if (!ejercicio || !respuestaUsuario) {
      return res.status(400).json({ error: "Faltan datos para calificar" });
    }

    let correctas = 0;
    let detalle = [];

    if (ejercicio.preguntas) {
      ejercicio.preguntas.forEach((pregunta, index) => {
        const correcta = (pregunta.correcta || "").trim();
        const usuario = (respuestaUsuario[index] || "").trim();

        const esCorrecta = correcta === usuario;

        detalle.push({
          pregunta: pregunta.pregunta,
          correcta,
          usuario,
          esCorrecta
        });

        if (esCorrecta) correctas++;
      });
    }

    const total = detalle.length;
    const score = total > 0 ? Math.round((correctas / total) * 100) : 0;

    // =======================
    // FEEDBACK IA
    // =======================
    const promptFeedback = `
You are an English teacher.

Reading level: ${ejercicio.nivel}

Score: ${score}/100
Correct answers: ${correctas}
Total questions: ${total}

Student answers:
${JSON.stringify(respuestaUsuario)}

Write short professional feedback (max 2 sentences).
Be encouraging and helpful.
`;

    const feedbackResponse = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are a helpful English teacher." },
        { role: "user", content: promptFeedback }
      ]
    });

    const feedback =
      feedbackResponse.choices?.[0]?.message?.content?.trim() || "Good job!";

    // =======================
    // 💾 GUARDAR EN DB (FIX FINAL)
    // =======================
    const sesion_id = 1; // 🔥 temporal
    const respuestasJSON = JSON.stringify(respuestaUsuario);

    db.query(
      `INSERT INTO resultados 
      (sesion_id, habilidad, puntaje, respuestas, feedback)
      VALUES (?, ?, ?, ?, ?)`,
      [
        sesion_id,
        "reading",
        score,
        respuestasJSON,
        feedback
      ],
      (err) => {
        if (err) {
          console.error("❌ Error guardando resultado:", err);
        } else {
          console.log("✅ Resultado guardado en DB");
        }
      }
    );

    // =======================
    // RESPUESTA
    // =======================
    res.json({
      score,
      correcto: score >= 70,
      feedback,
      detalle
    });

  } catch (error) {
    console.error("❌ Error Calificar Reading:", error);
    res.status(500).json({ error: "Error al calificar reading" });
  }
};