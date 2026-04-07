const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// FUNCION PARA LIMPIAR JSON
function limpiarJSON(texto) {
  return texto
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}


// GENERAR LISTENING
exports.generarListening = async (req, res) => {
  try {

    const { tema, nivel } = req.body;

    if (!tema || !nivel) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    // DESCRIPCION DEL NIVEL 
    let descripcionNivel = "";

    if (nivel === "A1") {
      descripcionNivel = "principiante. Usa frases muy cortas, vocabulario básico y estructura simple.";
    }
    else if (nivel === "A2") {
      descripcionNivel = "básico. Usa frases simples con vocabulario común.";
    }
    else if (nivel === "B1") {
      descripcionNivel = "intermedio. Usa conversaciones naturales con vocabulario cotidiano.";
    }
    else if (nivel === "B2") {
      descripcionNivel = "intermedio alto. Usa vocabulario más amplio, ideas más complejas y conversaciones más naturales.";
    }
    else if (nivel === "C1") {
      descripcionNivel = "avanzado. Usa vocabulario avanzado, ideas abstractas y lenguaje natural.";
    }
    else if (nivel === "C2") {
      descripcionNivel = "experto. Usa lenguaje complejo, natural y desafiante.";
    }

    const prompt = `
Genera un ejercicio de LISTENING en inglés.

Tema: "${tema}"
Nivel CEFR: ${nivel}

El nivel es ${descripcionNivel}

IMPORTANTE:

- El texto del audio debe coincidir con el nivel exactamente
- A1 = muy fácil
- A2 = fácil
- B1 = intermedio
- B2 = intermedio alto
- C1 = avanzado
- C2 = experto

Devuelve SOLO JSON valido, sin markdown, sin explicaciones.

Formato EXACTO:

{
  "tipo": "opcion_multiple",
  "audio_texto": "Texto del audio",
  "preguntas": [
    {
      "pregunta": "Pregunta",
      "opciones": ["A", "B", "C"],
      "correcta": "B"
    }
  ]
}

O:

{
  "tipo": "completar",
  "audio_texto": "Texto con ____",
  "respuestas": ["palabra1", "palabra2"]
}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    let contenido = response.output[0].content[0].text;
    contenido = limpiarJSON(contenido);

    let ejercicio;

try {
  ejercicio = JSON.parse(contenido);
} catch (e) {
  console.error("JSON inválido:", contenido);
  return res.status(500).json({
    error: "La IA devolvió un formato incorrecto"
  });
}

    ejercicio.nivel = nivel;

    // GENERAR AUDIO
    const audioResponse = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: ejercicio.audio_texto
    });

    const fileName = `audio_${Date.now()}.mp3`;
    const filePath = path.join(__dirname, "../public/audio", fileName);

    const buffer = Buffer.from(await audioResponse.arrayBuffer());

    fs.writeFileSync(filePath, buffer);

    ejercicio.audio_url = `/audio/${fileName}`;

    res.json(ejercicio);

  } catch (error) {

    console.error("Error Listening:", error);

    res.status(500).json({
      error: "Error generando listening"
    });

  }
};



// CALIFICAR LISTENING
exports.calificarListening = async (req, res) => {

  try {

    const { ejercicio, respuestaUsuario } = req.body;

    if (!ejercicio || !respuestaUsuario) {
      return res.status(400).json({
        error: "Faltan datos para calificar"
      });
    }

    let correctas = 0;
    let detalle = [];

    // FUNCION PARA NORMALIZAR TEXTO
    function normalizar(texto) {
      return (texto || "")
        .toString()
        .trim()
        .toLowerCase();
    }

    // OPCION MULTIPLE
    if (ejercicio.tipo === "opcion_multiple") {

      ejercicio.preguntas.forEach((pregunta, index) => {

        let respuestaCorrectaTexto = pregunta.correcta;

        // Si la correcta es A, B, C convertir a texto real
        if (
          typeof pregunta.correcta === "string" &&
          ["a", "b", "c"].includes(normalizar(pregunta.correcta))
        ) {

          const indexCorrecto =
            normalizar(pregunta.correcta).charCodeAt(0) - 97;

          respuestaCorrectaTexto =
            pregunta.opciones[indexCorrecto];
        }

        const respuestaUser = respuestaUsuario[index];

        const esCorrecta =
          normalizar(respuestaCorrectaTexto) ===
          normalizar(respuestaUser);

        detalle.push(esCorrecta);

        if (esCorrecta) correctas++;

      });

    }

    // COMPLETAR
    if (ejercicio.tipo === "completar") {

      ejercicio.respuestas.forEach((respuesta, index) => {

        const respuestaUser = respuestaUsuario[index];

        const esCorrecta =
          normalizar(respuesta) ===
          normalizar(respuestaUser);

        detalle.push(esCorrecta);

        if (esCorrecta) correctas++;

      });

    }

    const total = detalle.length;

    const score =
      total > 0
        ? Math.round((correctas / total) * 100)
        : 0;


    // DESCRIPCION NIVEL
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


    // FEEDBACK IA
    const promptFeedback = `
You are a professional English teacher.

The student is a ${descripcionNivel}.

Score: ${score}%
Correct answers: ${correctas}/${total}

Write motivational and professional feedback.

Rules:

- Adapt to the student level
- Max 2 sentences
- Be encouraging
- Sound professional
- Return ONLY feedback text
`;

    const responseIA = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: promptFeedback
    });

    const feedback =
      responseIA.output[0].content[0].text.trim();


    res.json({
      score,
      correcto: score >= 70,
      feedback,
      detalle
    });

  } catch (error) {

    console.error("Error calificar listening:", error);

    res.status(500).json({
      error: "Error al calificar listening"
    });

  }

};