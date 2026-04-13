const OpenAI = require("openai");
const fs = require("fs");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===============================
// GENERAR SPEAKING
// ===============================
exports.generarSpeaking = async (req, res) => {
  try {
    const { tema, nivel } = req.body;

    if (!tema || !nivel) {
      return res.status(400).json({
        error: "Faltan datos"
      });
    }

    const prompt = `
Genera un ejercicio de speaking en inglés en formato JSON.

Debe incluir:
- titulo
- instruccion
- fluency
- palabras (array de 5 palabras)
- ejemplo

Tema: ${tema}
Nivel: ${nivel}

Responde SOLO en JSON válido, sin texto extra.

Ejemplo:
{
  "titulo": "Pronunciation & Fluency Challenge",
  "instruccion": "Practice pronouncing the key words clearly and then speak naturally.",
  "fluency": "Describe your daily routine from morning to evening.",
  "palabras": ["morning", "work", "coffee", "walk", "evening"],
  "ejemplo": "Every morning I drink coffee. I go to work and take a walk."
}
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

    let speaking;

    try {
      speaking = JSON.parse(contenido);
    } catch (e) {
      console.error("JSON inválido:", contenido);
      return res.status(500).json({
        error: "La IA devolvió formato incorrecto"
      });
    }

    // 👇 AÑADIMOS NIVEL
    speaking.nivel = nivel;

    // 👇 ESTO ES CLAVE PARA TU FRONTEND
    speaking.prompt = speaking.fluency;

    res.json(speaking);

  } catch (error) {
    console.error("Error generando speaking:", error);

    res.status(500).json({
      error: "Error generando speaking"
    });
  }
};

// ===============================
// CALIFICAR SPEAKING
// ===============================
exports.calificarSpeaking = async (req, res) => {
  try {
    const audioPath = req.file.path;

    // 🎤 TRANSCRIPCIÓN
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1"
    });

    const texto = transcription.text;

    // 🧠 EVALUACIÓN CON FORMATO JSON
    const evaluacion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Eres un evaluador de inglés.

Evalúa el texto del usuario y responde SOLO en JSON válido con:

- score (0 a 100)
- nivel (A1, A2, B1, B2, C1, C2)
- feedback (breve y útil)

Reglas:
- Si la respuesta es muy corta → score bajo (0-30)
- Si es básica → 30-60
- Intermedia → 60-80
- Avanzada → 80-100

Ejemplo:
{
  "score": 75,
  "nivel": "B1",
  "feedback": "Good structure but improve vocabulary."
}
`
        },
        {
          role: "user",
          content: texto
        }
      ]
    });

    let respuesta = evaluacion.choices[0].message.content;

    // 🔧 LIMPIAR RESPUESTA
    respuesta = respuesta
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let resultado;

    try {
      resultado = JSON.parse(respuesta);
    } catch (e) {
      console.error("❌ JSON inválido:", respuesta);

      // fallback inteligente
      resultado = {
        score: texto.length < 10 ? 10 : 50,
        nivel: "A1",
        feedback: "No se pudo evaluar correctamente, intenta hablar más."
      };
    }

    fs.unlinkSync(audioPath);

    res.json({
      score: resultado.score,
      feedback: `Nivel: ${resultado.nivel}\n${resultado.feedback}`,
      transcript: texto
    });

  } catch (error) {
    console.error("🔥 ERROR SPEAKING:", error);

    res.status(500).json({
      error: "Error en speaking"
    });
  }
};