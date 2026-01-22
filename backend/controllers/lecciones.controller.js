const OpenAI = require("openai");
require("dotenv").config();

// Iniciar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Función para generar lección
exports.generarLeccion = async (req, res) => {
  try {
    const { tema, nivel, duracion } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Genera una lección detallada sobre el tema "${tema}" para un nivel "${nivel}". La lección debe incluir introducción, puntos clave, ejemplos prácticos y conclusión. Duración aproximada: ${duracion} minutos.`
        }
      ],
      max_tokens: 1200
    });

    res.json({
      leccion: completion.choices[0].message.content
    });

  } catch (error) {
    console.error("Error generando lección:", error);
    res.status(500).json({ error: "Error generando la lección" });
  }
};
