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
      return res.status(400).json({ error: "Faltan datos" });
    }

    const prompt = `
Genera un ejercicio de "Roleplay" profesional en inglés para practicar speaking.
Nivel: ${nivel}
Tema: ${tema}

El formato debe ser JSON con:
- titulo: Un nombre creativo para la situación.
- escenario: Describe el contexto real (ej. "Estás en una reunión de negocios...").
- objetivo: Qué debe lograr el usuario al hablar (ej. "Convencer al cliente de...").
- palabras_clave: Un array de 5 palabras técnicas o útiles que el usuario DEBE usar.
- reto_extra: Un desafío gramatical (ej. "Usa al menos un condicional").

Responde SOLO el JSON.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });

    let contenido = response.choices[0].message.content.replace(/```json/g, "").replace(/```/g, "").trim();
    let speaking = JSON.parse(contenido);
    
    // Mantenemos compatibilidad con tu frontend actual
    speaking.nivel = nivel;
    speaking.instruccion = speaking.objetivo; // El objetivo será la instrucción
    speaking.fluency = speaking.escenario;    // El escenario será el texto principal

    res.json(speaking);

  } catch (error) {
    console.error("Error generando speaking:", error);
    res.status(500).json({ error: "Error al generar el ejercicio" });
  }
};

// CALIFICAR SPEAKING
exports.calificarSpeaking = async (req, res) => {
  try {
    const audioPath = req.file.path;
    const { ejercicio } = req.body;
    const datosEjercicio = JSON.parse(ejercicio);

  
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1"
    });

    const textoUsuario = transcription.text;

    const evaluacion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un profesor de inglés experto. Evalúa el audio considerando:
          1. Escenario: "${datosEjercicio.escenario}"
          2. Objetivo: "${datosEjercicio.objetivo}"
          3. Palabras Clave: ${datosEjercicio.palabras_clave.join(", ")}

          Responde SOLO en JSON:
          {
            "score": (0-100),
            "pronunciation_feedback": "comentario breve sobre claridad",
            "grammar_feedback": "comentario sobre gramática",
            "keywords_used": (cuántas palabras clave de las 5 usó),
            "final_feedback": "resumen motivador en español"
          }`
        },
        { role: "user", content: textoUsuario }
      ]
    });

    let respuesta = evaluacion.choices[0].message.content.replace(/```json/g, "").replace(/```/g, "").trim();
    const resultado = JSON.parse(respuesta);

    fs.unlinkSync(audioPath);

    res.json({
      score: resultado.score,
      transcript: textoUsuario,
      feedback: `
        🎯 Score: ${resultado.score}/100
        ✅ Palabras clave usadas: ${resultado.keywords_used}/5
        💡 Gramática: ${resultado.grammar_feedback}
        🎤 Pronunciación: ${resultado.pronunciation_feedback}
        🌟 Sugerencia: ${resultado.final_feedback}
      `.trim()
    });

  } catch (error) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Error al calificar" });
  }
};