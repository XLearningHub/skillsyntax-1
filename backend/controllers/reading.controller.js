const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


exports.generarReading = async (req, res) => {
  const { tema, nivel } = req.body;

  res.json({
    reading: `Lección simulada de reading.
Tema: ${tema}
Nivel: ${nivel}
(Esta es una respuesta de prueba sin usar OpenAI)`
  });
};


/*exports.generarReading = async (req, res) => {
  try {
    const { tema, nivel } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Genera una lección de READING sobre ${tema} para nivel ${nivel}. Incluye texto de lectura y preguntas de comprensión.`
      }],
      max_tokens: 800
    });


    res.json({ reading: response.choices[0].message.content });


  } catch (error) {
    res.status(500).json({ error: "Error generando reading" });
  }
}; 
*/

