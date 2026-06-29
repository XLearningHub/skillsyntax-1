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

    // ── SWITCH DE NIVEL: cada nivel puede tener su propio super-prompt ──
    let prompt;

    switch (nivel) {

      // ─────────────────────────────────────────────
      // NIVEL A1 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'A1':
        prompt = `
You are a specialist English teacher for complete beginners (CEFR level A1).
Create a SHORT reading exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise (text, questions, options, etc.) MUST be generated in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. Write EXACTLY 3 to 4 sentences. No more, no less. Format the text as ONE SINGLE CONTINUOUS PARAGRAPH. Do NOT use line breaks (\n), bullet points, or numbered lists between sentences.
2. Use ONLY Present Simple tense or the verb "To Be" (am / is / are).
3. Every word must be A1 basic vocabulary DIRECTLY related to "${tema}".
4. NO compound words (e.g., no "daydream", "sunlight").
5. NO idioms, NO phrasal verbs, NO contractions (write "I am" not "I'm").
6. Sentences must be SHORT: maximum 8 words each.
7. Write 2 comprehension questions. Each question must have 4 options.
   - Questions use only "What", "Who", "Where" — no complex wording.
   - Correct answer must appear literally in the text.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "reading",
  "nivel": "A1",
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
        break;

      // ─────────────────────────────────────────────
      // NIVEL A2 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'A2':
        prompt = `
You are a specialist English teacher for elementary learners (CEFR level A2).
Create a SHORT reading exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise (text, questions, options, etc.) MUST be generated in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it internally. DO NOT output any Spanish words.
1. Write EXACTLY 4 to 6 sentences. No more, no less. Format the text as ONE SINGLE CONTINUOUS PARAGRAPH. Do NOT use line breaks (\n), bullet points, or numbered lists between sentences.
2. Allowed grammar: Present Simple, Past Simple, and Future with "going to". No other tenses.
3. Every word must be A2 vocabulary STRICTLY related to the topic "${tema}". No idioms, no phrasal verbs.
4. Sentences should be clear and short (maximum 12 words each).
5. Write EXACTLY 3 comprehension questions. Each question must have EXACTLY 4 options.
   - Questions may use "What", "Who", "Where", "When", or "Why".
   - The correct answer must be found directly in the text.
   - "respuesta_correcta" must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "reading",
  "nivel": "A2",
  "tema": "${tema}",
  "texto": "...",
  "preguntas": [
    {
      "pregunta": "...",
      "opciones": ["...", "...", "...", "..."],
      "respuesta_correcta": "..."
    },
    {
      "pregunta": "...",
      "opciones": ["...", "...", "...", "..."],
      "respuesta_correcta": "..."
    },
    {
      "pregunta": "...",
      "opciones": ["...", "...", "...", "..."],
      "respuesta_correcta": "..."
    }
  ]
}
`;
        break;

      // ─────────────────────────────────────────────
      // NIVEL B1 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'B1':
        prompt = `
You are a specialist English teacher for intermediate learners (CEFR level B1).
Create a READING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise MUST be generated in ENGLISH. If the topic '${tema}' is in Spanish or has typos, translate it internally. NO Spanish output.
1. Write 2 to 3 SHORT PARAGRAPHS totaling approximately 100 to 150 words. Format each paragraph as a continuous block of text. Do NOT use line breaks (\\n), bullet points, or numbered lists within or between paragraphs.
2. Allowed grammar: Present Simple, Past Simple, Future (will / going to), and Present Perfect. No other tenses.
3. Use B1-level vocabulary related to "${tema}". Phrasal verbs and common idioms are allowed.
4. Write EXACTLY 4 comprehension questions. Each question must have EXACTLY 4 options.
   - Questions must require understanding the context, not just spotting literal words.
   - Questions may use "What", "Why", "How", "Where", "When", or "Which".
   - "respuesta_correcta" must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "reading",
  "nivel": "B1",
  "tema": "${tema}",
  "texto": "Paragraph one... Paragraph two... Paragraph three...",
  "preguntas": [
    {
      "pregunta": "...",
      "opciones": ["...", "...", "...", "..."],
      "respuesta_correcta": "..."
    },
    {
      "pregunta": "...",
      "opciones": ["...", "...", "...", "..."],
      "respuesta_correcta": "..."
    },
    {
      "pregunta": "...",
      "opciones": ["...", "...", "...", "..."],
      "respuesta_correcta": "..."
    },
    {
      "pregunta": "...",
      "opciones": ["...", "...", "...", "..."],
      "respuesta_correcta": "..."
    }
  ]
}
`;
        break;

      // ─────────────────────────────────────────────
      // NIVEL B2 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'B2':
        prompt = `
You are a specialist English teacher for upper-intermediate learners (CEFR level B2).
Create a READING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: Generate EVERYTHING in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. Write 3 to 4 paragraphs totaling approximately 200 words. Format the text as CONTINUOUS PARAGRAPHS. Do NOT use line breaks (\n) between sentences within or between paragraphs.
2. Use passive voice constructions (e.g., "it has been argued", "the results were found") and conditional sentences (e.g., "if this trend continues", "had they known").
3. Vocabulary must be B2 level, clearly related to "${tema}". Phrasal verbs and idiomatic expressions are encouraged.
4. Write EXACTLY 5 comprehension questions. Each question must have EXACTLY 4 options.
   - Questions must require understanding implied meaning and context, not just spotting literal words.
   - "respuesta_correcta" must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "reading",
  "nivel": "B2",
  "tema": "${tema}",
  "texto": "Paragraph one... Paragraph two... Paragraph three... Paragraph four...",
  "preguntas": [
    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." }
  ]
}
`;
        break;

      // ─────────────────────────────────────────────
      // NIVEL C1 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'C1':
        prompt = `
You are a specialist English teacher for advanced learners (CEFR level C1).
Create a READING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: Generate EVERYTHING in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. Write 4 to 5 paragraphs totaling approximately 250 to 300 words. Format the text as CONTINUOUS PARAGRAPHS. Do NOT use line breaks (\n) between sentences within or between paragraphs.
2. Use an academic and professional tone throughout. Incorporate complex phrasal verbs (e.g., "bring about", "give rise to", "account for") and grammatical inversions (e.g., "Not only does...", "Rarely have...", "Should this prove...").
3. Vocabulary must be C1 level, sophisticated and nuanced, directly related to "${tema}".
4. Write EXACTLY 5 comprehension questions. Each question must have EXACTLY 4 options.
   - Questions MUST require inference and critical thinking — students cannot answer by simply locating literal words in the text.
   - Questions should test tone, implication, author intent, and logical deduction.
   - "respuesta_correcta" must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "reading",
  "nivel": "C1",
  "tema": "${tema}",
  "texto": "Paragraph one... Paragraph two... Paragraph three... Paragraph four... Paragraph five...",
  "preguntas": [
    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." }
  ]
}
`;
        break;

      // ─────────────────────────────────────────────
      // NIVEL C2 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'C2':
        prompt = `
You are a specialist English teacher for proficiency/mastery learners (CEFR level C2).
Create a READING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise MUST be generated in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it internally. DO NOT output any Spanish words.
1. Write 4 to 6 DENSE paragraphs totaling approximately 300 to 350 words. Format the text as CONTINUOUS PARAGRAPHS. Do NOT use line breaks (\n) between sentences within or between paragraphs.
2. Use a highly academic, literary, or philosophical tone throughout. Incorporate native-level sophisticated vocabulary, advanced collocations, irony, implied meaning, and highly complex syntax (e.g., embedded clauses, appositives, periodic sentences).
3. Include advanced coloquialisms, rhetorical devices (e.g., antithesis, epistrophe), and subtle cultural or ideological references related to "${tema}".
4. Write EXACTLY 5 complex comprehension questions. Each question must have EXACTLY 4 options.
   - Questions MUST require deep critical analysis, philosophical inference, and evaluation of the author's stance, irony, or subtextual intent — NOT mere literal recall.
   - Questions should test the reader's ability to interpret ambiguity, deduce implicit arguments, and assess rhetorical strategy.
   - "respuesta_correcta" must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "reading",
  "nivel": "C2",
  "tema": "${tema}",
  "texto": "Dense paragraph one... Dense paragraph two... Dense paragraph three... Dense paragraph four...",
  "preguntas": [
    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." }
  ]
}
`;
        break;

      // ─────────────────────────────────────────────
      // DEFAULT — fallback genérico de seguridad
      // ─────────────────────────────────────────────
      default:
        prompt = `
You are an expert English teacher specialized in the CEFR standard.
Create a reading exercise for a student at level: ${nivel}.
TOPIC: ${tema}
Return ONLY valid JSON: { "tipo": "reading", "nivel": "${nivel}", "tema": "${tema}", "texto": "...", "preguntas": [{ "pregunta": "...", "opciones": ["...","...","...","..."], "respuesta_correcta": "..." }] }
`;
        break;

    } // end switch

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