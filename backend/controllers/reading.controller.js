const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.generarReading = async (req, res) => {
  try {
    const { tema, nivel } = req.body;
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `Genera una lección de READING sobre ${tema} para nivel ${nivel}. 
Incluye texto de lectura y preguntas de comprensión.`
    });
    res.json({
      reading: response.output[0].content[0].text
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando reading" });
  }
};

