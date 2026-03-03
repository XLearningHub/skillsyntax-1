const OpenAI = require("openai");
const fs = require("fs");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// GENERAR SPEAKING
exports.generarSpeaking = async (req, res) => {

  try {

    const { tema, nivel } = req.body;

    if (!tema || !nivel) {
      return res.status(400).json({
        error: "Faltan datos"
      });
    }

    const prompt = `
Generate a PROFESSIONAL English speaking practice.

Topic: ${tema}
Level: ${nivel}

Respond ONLY with valid JSON.
Do NOT use \`\`\`json or \`\`\`
Do NOT add extra text.

Exact format:

{
  "titulo":"Pronunciation & Fluency Challenge",
  "instruccion":"Clear instruction for the student",
  "palabras_clave":["word1","word2","word3","word4","word5"],
  "reto_fluidez":"Short speaking task where the student speaks naturally (NOT questions)",
  "frase_modelo":"Example of a good response adapted to the level"
}

Rules:

- Adapt vocabulary strictly to CEFR level ${nivel}
- Words must help pronunciation practice
- The fluency task must promote natural speech
- Keep it modern and professional
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

    const speaking = JSON.parse(contenido);

    speaking.nivel = nivel;

    res.json(speaking);

  } catch (error) {

    console.error("Error generando speaking:", error);

    res.status(500).json({
      error: "Error generando speaking"
    });

  }

};


// CALIFICAR SPEAKING
exports.calificarSpeaking = async (req, res) => {

  try {

    const { ejercicio } = req.body;

    if (!req.file || !ejercicio) {
      return res.status(400).json({
        error: "Faltan datos para evaluar speaking"
      });
    }

    const audioPath = req.file.path;

    // TRANSCRIBIR AUDIO
    const transcriptionResponse =
      await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: "gpt-4o-mini-transcribe"
      });

    const transcripcion = transcriptionResponse.text;

    const promptEvaluacion = `
You are a certified English speaking examiner.

CEFR Level: ${ejercicio.nivel}

Evaluate the following speaking response:

"${transcripcion}"

Evaluate:

- Grammar accuracy
- Vocabulary range
- Coherence and organization
- Fluency

Give a score from 0 to 100.

Return ONLY valid JSON:

{
  "score": 85,
  "feedback": "Professional feedback here"
}
`;

    const responseIA = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: promptEvaluacion
    });

    let resultado = responseIA.output[0].content[0].text;

    resultado = resultado
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const evaluacion = JSON.parse(resultado);

    const score = evaluacion.score;

    res.json({
      score,
      correcto: score >= 70,
      feedback: evaluacion.feedback,
      transcripcion
    });

  } catch (error) {

    console.error("Error calificar speaking:", error);

    res.status(500).json({
      error: "Error al calificar speaking"
    });

  }

};