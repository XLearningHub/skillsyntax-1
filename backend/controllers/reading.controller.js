const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.generarReading = async (req, res) => {
  try {
    let tema = req.body.tema || "daily life";
    const nivel = req.body.nivel || "A1";

    tema = tema
      .toLowerCase()
      .replace(/(generame|genera|quiero aprender|hazme|hacer|una) (leccion|lección|clase|ejercicio) (de|sobre)/gi, "")
      .trim();

    const prompt = `
You are an expert English teacher specialized in the CEFR standard.
Create a reading exercise for a student at level: ${nivel}.

TOPIC: ${tema}

STRICT LEVEL RULES:
- A1-A2: 3-4 simple sentences.
- B1-B2: 5-7 sentences.
- C1-C2: 8-10 complex sentences.

Return ONLY this JSON:
{
  "tipo": "reading",
  "nivel": "${nivel}",
  "tema": "${tema}",
  "texto": "...",
  "preguntas": [
    {
      "pregunta": "...",
      "opciones": ["...", "...", "...", "..."],
      "respuesta_correcta": "..."
    }
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: "You are a teacher who only communicates in English and provides structured JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const ejercicio = JSON.parse(response.choices[0].message.content);
    return res.json(ejercicio);

  } catch (error) {
    console.error("ERROR EN OPENAI READING:", error);
    res.status(500).json({ error: "Error generating reading" });
  }
};


exports.generarFeedbackIA = async (ejercicio, respuestasUsuario, score) => {
  try {
    // Creamos un resumen de los errores para que la IA sepa qué pasó
    const resumenResultados = ejercicio.preguntas.map((p, i) => {
      const esCorrecta = respuestasUsuario[i] === (p.respuesta_correcta || p.correcta);
      return `Q: ${p.pregunta} | User answered: ${respuestasUsuario[i] || "No answer"} | Correct: ${p.respuesta_correcta || p.correcta} | Result: ${esCorrecta ? "Correct" : "Wrong"}`;
    }).join("\n");

    const prompt = `
You are a supportive English teacher. Provide short, personalized feedback (max 2 sentences) in English.
Student Score: ${score}/100
Exercise Topic: ${ejercicio.tema}

Results details:
${resumenResultados}

Instructions:
- If the score is 100, be enthusiastic.
- If they failed some questions, briefly explain why or give a tip based on the topic.
- Always be encouraging and stay in English.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful English teacher giving feedback." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    return response.choices[0].message.content.trim();

  } catch (error) {
    console.error("Error en Feedback IA:", error);
    return "Great effort! Keep practicing to improve your skills.";
  }
};