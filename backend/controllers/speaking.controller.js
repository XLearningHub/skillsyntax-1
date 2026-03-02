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

    // descripcion nivel
    let descripcionNivel = "";

    if (nivel === "A1")
      descripcionNivel = "beginner, very simple questions";

    else if (nivel === "A2")
      descripcionNivel = "basic student, simple sentences";

    else if (nivel === "B1")
      descripcionNivel = "intermediate student, everyday topics";

    else if (nivel === "B2")
      descripcionNivel = "upper intermediate, more detailed answers";

    else if (nivel === "C1")
      descripcionNivel = "advanced student, complex ideas";

    else if (nivel === "C2")
      descripcionNivel = "proficient student, natural fluent conversation";


    const prompt = `
Generate a SPEAKING exercise in English.

Topic: ${tema}
Level: ${nivel}
Student level: ${descripcionNivel}

Return ONLY valid JSON.

Format:

{
  "titulo":"Speaking Practice",
  "instruccion":"Instruction text",
  "preguntas":[
    {
      "pregunta":"Question",
      "ejemplo":"Example answer"
    }
  ]
}

Rules:

- adapt difficulty to level
- include 3 questions
- include example answers
- simple and clear
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

    console.error(error);

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


    //  DESCRIPCION NIVEL
    let descripcionNivel = "";

    if (ejercicio.nivel === "A1")
      descripcionNivel = "beginner student";

    else if (ejercicio.nivel === "A2")
      descripcionNivel = "basic student";

    else if (ejercicio.nivel === "B1")
      descripcionNivel = "intermediate student";

    else if (ejercicio.nivel === "B2")
      descripcionNivel = "upper-intermediate student";

    else if (ejercicio.nivel === "C1")
      descripcionNivel = "advanced student";

    else if (ejercicio.nivel === "C2")
      descripcionNivel = "proficient student";


    //  EVALUACION 
    const promptEvaluacion = `
You are a certified English speaking examiner.

The student is a ${descripcionNivel}.

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

    let resultado =
      responseIA.output[0].content[0].text;

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