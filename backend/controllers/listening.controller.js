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

    // DESCRIPCION DEL NIVEL CEFR
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

    // LIMPIAR JSON
    let contenido = response.output[0].content[0].text;
    contenido = limpiarJSON(contenido);

    const ejercicio = JSON.parse(contenido);

    // GUARDAR NIVEL EN EL EJERCICIO
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


    // AGREGAR URL DEL AUDIO
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

Nivel del ejercicio: ${ejercicio.nivel || "no especificado"}

Ejercicio:
${JSON.stringify(ejercicio)}

Respuestas del estudiante:
${JSON.stringify(respuestaUsuario)}

Evalúa según el nivel CEFR.

Devuelve SOLO JSON valido:

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

    // LIMPIAR JSON
    let resultadoTexto = response.output[0].content[0].text;
    resultadoTexto = limpiarJSON(resultadoTexto);

    const resultado = JSON.parse(resultadoTexto);

    res.json(resultado);

  } catch (error) {

    console.error("Error calificar listening:", error);

    res.status(500).json({
      error: "Error al calificar listening"
    });

  }
};
