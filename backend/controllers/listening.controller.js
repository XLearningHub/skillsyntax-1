const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// GENERAR LISTENING
exports.generarListening = async (req, res) => {
  try {

    const { tema, nivel } = req.body;

    if (!tema || !nivel) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const prompt = `
Genera un ejercicio de LISTENING en inglés para nivel ${nivel} sobre el tema "${tema}".

IMPORTANTE:
Simula que es un listening, pero devuelve el script del audio como texto.

Debes responder SOLO en formato JSON.

Formato EXACTO:

{
  "tipo": "opcion_multiple",
  "audio_texto": "Texto que representa el audio que el estudiante escuchará",
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
  "audio_texto": "Texto del audio con ____ para completar",
  "respuestas": ["palabra1", "palabra2"]
}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    const contenido = response.output[0].content[0].text;

    const ejercicio = JSON.parse(contenido);


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


    // AGREGAR URL DEL AUDIO AL MISMO JSON
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

    const prompt = `
Eres un profesor de inglés.

Este es el ejercicio de listening:
${JSON.stringify(ejercicio)}

Esta es la respuesta del estudiante:
${JSON.stringify(respuestaUsuario)}

Evalúa la respuesta.

Devuelve SOLO JSON en este formato:

{
  "score": 0-100,
  "correcto": true,
  "feedback": "Explicación breve"
}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    const resultadoTexto = response.output[0].content[0].text;

    const resultado = JSON.parse(resultadoTexto);

    res.json(resultado);

  } catch (error) {

    console.error("Error calificar listening:", error);

    res.status(500).json({
      error: "Error al calificar listening"
    });

  }
};
