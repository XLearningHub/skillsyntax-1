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

Debes responder SOLO en formato JSON, sin texto adicional.

Hay DOS tipos posibles:
1. opcion_multiple
2. completar

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

    const contenido = response.output[0].content[0].text;
    const ejercicio = JSON.parse(contenido);

    res.json(ejercicio);

  } catch (error) {
    console.error("Error Reading:", error);
    res.status(500).json({ error: "Error generando reading" });
  }
};

// CALIFICAR READING 
exports.calificarReading = async (req, res) => {
  try {
    const { ejercicio, respuestaUsuario } = req.body;

    if (!ejercicio || !respuestaUsuario) {
      return res.status(400).json({ error: "Faltan datos para calificar" });
    }

    const prompt = `
Eres un profesor de inglés.

Este es el ejercicio de reading:
${JSON.stringify(ejercicio)}

Esta es la respuesta del estudiante:
${JSON.stringify(respuestaUsuario)}

Evalúa la respuesta y devuelve SOLO JSON con este formato:

{
  "score": 0-100,
  "correcto": true | false,
  "feedback": "Explicación breve para el estudiante"
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
    console.error("Error al calificar reading:", error);
    res.status(500).json({ error: "Error al calificar reading" });
  }
};
