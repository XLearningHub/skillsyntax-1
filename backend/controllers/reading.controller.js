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

    // (selector dinámico eliminado — el tema lo controla el usuario)

    // ── LÓGICA DINÁMICA DE PREGUNTAS (calculada ANTES del switch) ──────
    let numPreguntas;
    switch (nivel) {
      case 'A1': numPreguntas = 2; break;
      case 'A2': numPreguntas = Math.random() < 0.5 ? 3 : 4; break;
      case 'B1': numPreguntas = 5; break;
      case 'B2': numPreguntas = Math.random() < 0.5 ? 6 : 7; break;
      case 'C1': numPreguntas = Math.random() < 0.5 ? 8 : 9; break;
      case 'C2': numPreguntas = 10; break;
      default:   numPreguntas = 3;
    }

    // ── MAPA ESTRICTO DE PALABRAS POR NIVEL CEFR ────────────────────────
    const wordCountMap = {
      A1: 50,
      A2: 150,
      B1: 250,
      B2: 350,
      C1: 400,
      C2: 600
    };
    const exactWordCount = wordCountMap[nivel] || 150;

    // Helper: genera el bloque de N objetos pregunta para el JSON schema del prompt
    const schemaPreguntas = Array.from({ length: numPreguntas }, () =>
      `    { "pregunta": "...", "opciones": ["...", "...", "...", "..."], "respuesta_correcta": "..." }`
    ).join(',\n');

    // ── SWITCH DE NIVEL: cada nivel tiene su propio super-prompt ────────
    let prompt;

    switch (nivel) {

      // ─────────────────────────────────────────────
      // NIVEL A1 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'A1':
        prompt = `
You are a specialist English teacher for complete beginners (CEFR level A1).
Create a SHORT reading exercise strictly about the topic: "${tema}".

CONTEXT VARIETY DIRECTIVE (MANDATORY): The core topic for this exercise is strictly "${tema}". You MUST write about this topic, but generate a UNIQUE and highly specific real-world situation, perspective, or format for this generation. For example, if the topic is "Food", do not write a generic text about food; instead, write a restaurant review, a conversation about a grocery list, or a chef's interview. Vary the angle wildly on each request, but keep the content 100% logical, realistic, and strictly appropriate for CEFR level A1.

CEFR CONTEXT SCALING (A1 — MANDATORY): Since this is level A1, the situation MUST involve a very simple, familiar, everyday topic that a complete beginner would recognise immediately — for example: describing a home, ordering food, greeting someone, a basic shopping list, or a daily routine. Never use abstract concepts, professional jargon, or complex cultural references at this level.

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise (text, questions, options, etc.) MUST be generated in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. WORD COUNT RULE (MANDATORY): The "texto" field MUST contain EXACTLY ${exactWordCount} words. Count every word carefully before returning. This is non-negotiable.
   FORMAT RULE: Organize the text into SHORT PARAGRAPHS separated by a double line break (\\n\\n). Each paragraph must contain 3 to 5 cohesive sentences. Think of a professionally formatted book.
2. Use ONLY Present Simple tense or the verb "To Be" (am / is / are).
3. Every word must be A1 basic vocabulary DIRECTLY related to "${tema}".
4. NO compound words (e.g., no "daydream", "sunlight").
5. NO idioms, NO phrasal verbs, NO contractions (write "I am" not "I'm").
6. Sentences must be SHORT: maximum 8 words each.
7. Write EXACTLY ${numPreguntas} comprehension questions. Each question must have 4 options.
   - Questions use only "What", "Who", "Where" — no complex wording.
   - Correct answer must appear literally in the text.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "reading",
  "nivel": "A1",
  "tema": "${tema}",
  "texto": "First paragraph here.\\n\\nSecond paragraph here if needed.",
  "preguntas": [
${schemaPreguntas}
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

CONTEXT VARIETY DIRECTIVE (MANDATORY): The core topic for this exercise is strictly "${tema}". You MUST write about this topic, but generate a UNIQUE and highly specific real-world situation, perspective, or format for this generation. For example, if the topic is "Food", do not write a generic text about food; instead, write a restaurant review, a conversation about a grocery list, or a chef's interview. Vary the angle wildly on each request, but keep the content 100% logical, realistic, and strictly appropriate for CEFR level A2.

CEFR CONTEXT SCALING (A2 — MANDATORY): Since this is level A2, the situation must be realistic and close to daily life — for example: sending a text to a friend, describing a place or recent event, talking about plans, or writing a simple note. Slightly more detail than A1 but still very concrete and accessible. Never use abstract or academic themes.

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise (text, questions, options, etc.) MUST be generated in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it internally. DO NOT output any Spanish words.
1. WORD COUNT RULE (MANDATORY): The "texto" field MUST contain EXACTLY ${exactWordCount} words. Count every word carefully before returning. This is non-negotiable.
   FORMAT RULE: Separate paragraphs with a double line break (\\n\\n). Each paragraph must contain 3 to 5 cohesive sentences. Structure the text like a professionally formatted book — do NOT create a single wall of text.
2. Allowed grammar: Present Simple, Past Simple, and Future with "going to". No other tenses.
3. Every word must be A2 vocabulary STRICTLY related to the topic "${tema}". No idioms, no phrasal verbs.
4. Sentences should be clear and short (maximum 12 words each).
5. Write EXACTLY ${numPreguntas} comprehension questions. Each question must have EXACTLY 4 options.
   - Questions may use "What", "Who", "Where", "When", or "Why".
   - The correct answer must be found directly in the text.
   - "respuesta_correcta" must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "reading",
  "nivel": "A2",
  "tema": "${tema}",
  "texto": "First paragraph (3-5 sentences).\\n\\nSecond paragraph (3-5 sentences).",
  "preguntas": [
${schemaPreguntas}
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

CONTEXT VARIETY DIRECTIVE (MANDATORY): The core topic for this exercise is strictly "${tema}". You MUST write about this topic, but generate a UNIQUE and highly specific real-world situation, perspective, or format for this generation. For example, if the topic is "Food", do not write a generic text about food; instead, write a restaurant review, a conversation about a grocery list, or a chef's interview. Vary the angle wildly on each request, but keep the content 100% logical, realistic, and strictly appropriate for CEFR level B1.

CEFR CONTEXT SCALING (B1 — MANDATORY): Since this is level B1, the situation should involve opinions, past experiences, or interpersonal situations — for example: giving a review, recounting a travel anecdote, expressing a preference, describing a problem at work or school, or writing an informal complaint. Language can be more varied but context must remain relatable and grounded.

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise MUST be generated in ENGLISH. If the topic '${tema}' is in Spanish or has typos, translate it internally. NO Spanish output.
1. WORD COUNT RULE (MANDATORY): The "texto" field MUST contain EXACTLY ${exactWordCount} words. Count every word carefully before returning. This is non-negotiable.
   FORMAT RULE: Separate each paragraph with a double line break (\\n\\n). Each paragraph must contain 3 to 5 cohesive, well-connected sentences. Structure the text like a professionally formatted article — do NOT produce a wall of text.
2. Allowed grammar: Present Simple, Past Simple, Future (will / going to), and Present Perfect. No other tenses.
3. Use B1-level vocabulary related to "${tema}". Phrasal verbs and common idioms are allowed.
4. Write EXACTLY ${numPreguntas} comprehension questions. Each question must have EXACTLY 4 options.
   - Questions must require understanding the context, not just spotting literal words.
   - Questions may use "What", "Why", "How", "Where", "When", or "Which".
   - "respuesta_correcta" must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "reading",
  "nivel": "B1",
  "tema": "${tema}",
  "texto": "First paragraph (3-5 sentences).\\n\\nSecond paragraph (3-5 sentences).\\n\\nThird paragraph (3-5 sentences).",
  "preguntas": [
${schemaPreguntas}
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

CONTEXT VARIETY DIRECTIVE (MANDATORY): The core topic for this exercise is strictly "${tema}". You MUST write about this topic, but generate a UNIQUE and highly specific real-world situation, perspective, or format for this generation. For example, if the topic is "Food", do not write a generic text about food; instead, write a restaurant review, a conversation about a grocery list, or a chef's interview. Vary the angle wildly on each request, but keep the content 100% logical, realistic, and strictly appropriate for CEFR level B2.

CEFR CONTEXT SCALING (B2 — MANDATORY): Since this is level B2, the situation should involve argumentation, analysis, or structured opinion — for example: debating a social or environmental issue, writing a semi-formal letter, analysing a trend, or evaluating a professional problem. The context can be professional or semi-academic. Avoid overly simple or overly abstract themes.

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: Generate EVERYTHING in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. WORD COUNT RULE (MANDATORY): The "texto" field MUST contain EXACTLY ${exactWordCount} words. Count every word carefully before returning. This is non-negotiable.
   FORMAT RULE: Separate each paragraph with a double line break (\\n\\n). Each paragraph must contain 3 to 5 cohesive sentences with smooth transitions between ideas. Write like a professional journalist or essayist — never a wall of text.
2. Use passive voice constructions (e.g., "it has been argued", "the results were found") and conditional sentences (e.g., "if this trend continues", "had they known").
3. Vocabulary must be B2 level, clearly related to "${tema}". Phrasal verbs and idiomatic expressions are encouraged.
4. Write EXACTLY ${numPreguntas} comprehension questions. Each question must have EXACTLY 4 options.
   - Questions must require understanding implied meaning and context, not just spotting literal words.
   - "respuesta_correcta" must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "reading",
  "nivel": "B2",
  "tema": "${tema}",
  "texto": "First paragraph (3-5 sentences).\\n\\nSecond paragraph (3-5 sentences).\\n\\nThird paragraph (3-5 sentences).\\n\\nFourth paragraph (3-5 sentences).",
  "preguntas": [
${schemaPreguntas}
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

CONTEXT VARIETY DIRECTIVE (MANDATORY): The core topic for this exercise is strictly "${tema}". You MUST write about this topic, but generate a UNIQUE and highly specific real-world situation, perspective, or format for this generation. For example, if the topic is "Food", do not write a generic text about food; instead, write a restaurant review, a conversation about a grocery list, or a chef's interview. Vary the angle wildly on each request, but keep the content 100% logical, realistic, and strictly appropriate for CEFR level C1.

CEFR CONTEXT SCALING (C1 — MANDATORY): Since this is level C1, the situation should involve complex, abstract, or academic themes — for example: analysing a philosophical concept, arguing a professional or ethical position, evaluating a policy or socio-cultural dilemma. Language and context must be sophisticated, nuanced, and intellectually demanding. Avoid simple or everyday scenarios.

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: Generate EVERYTHING in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. WORD COUNT RULE (MANDATORY): The "texto" field MUST contain EXACTLY ${exactWordCount} words. Count every word carefully before returning. This is non-negotiable.
   FORMAT RULE: Separate each paragraph with a double line break (\\n\\n). Each paragraph must contain 3 to 5 cohesive sentences with sophisticated transitions. Write with the structure and polish of an academic journal article — never a wall of text.
2. Use an academic and professional tone throughout. Incorporate complex phrasal verbs (e.g., "bring about", "give rise to", "account for") and grammatical inversions (e.g., "Not only does...", "Rarely have...", "Should this prove...").
3. Vocabulary must be C1 level, sophisticated and nuanced, directly related to "${tema}".
4. Write EXACTLY ${numPreguntas} comprehension questions. Each question must have EXACTLY 4 options.
   - Questions MUST require inference and critical thinking — students cannot answer by simply locating literal words in the text.
   - Questions should test tone, implication, author intent, and logical deduction.
   - "respuesta_correcta" must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "reading",
  "nivel": "C1",
  "tema": "${tema}",
  "texto": "First paragraph.\\n\\nSecond paragraph.\\n\\nThird paragraph.\\n\\nFourth paragraph.\\n\\nFifth paragraph.",
  "preguntas": [
${schemaPreguntas}
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

CONTEXT VARIETY DIRECTIVE (MANDATORY): The core topic for this exercise is strictly "${tema}". You MUST write about this topic, but generate a UNIQUE and highly specific real-world situation, perspective, or format for this generation. For example, if the topic is "Food", do not write a generic text about food; instead, write a restaurant review, a conversation about a grocery list, or a chef's interview. Vary the angle wildly on each request, but keep the content 100% logical, realistic, and strictly appropriate for CEFR level C2.

CEFR CONTEXT SCALING (C2 — MANDATORY): Since this is level C2, the situation must be intellectually challenging and philosophically nuanced — for example: a philosophical paradox, a rhetorical analysis, a cross-disciplinary academic debate, or a critique of a socio-political system. Expect near-native critical thinking and mastery of the language. Never use simple or concrete everyday scenarios.

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise MUST be generated in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it internally. DO NOT output any Spanish words.
1. WORD COUNT RULE (MANDATORY): The "texto" field MUST contain EXACTLY ${exactWordCount} words. Count every word carefully before returning. This is non-negotiable.
   FORMAT RULE: Separate each paragraph with a double line break (\\n\\n). Each paragraph must contain 3 to 5 richly constructed sentences with masterful transitions. Write with the depth and structure of a literary essay or philosophical treatise — never a wall of text.
2. Use a highly academic, literary, or philosophical tone throughout. Incorporate native-level sophisticated vocabulary, advanced collocations, irony, implied meaning, and highly complex syntax (e.g., embedded clauses, appositives, periodic sentences).
3. Include advanced collocations, rhetorical devices (e.g., antithesis, epistrophe), and subtle cultural or ideological references related to "${tema}".
4. Write EXACTLY ${numPreguntas} complex comprehension questions. Each question must have EXACTLY 4 options.
   - Questions MUST require deep critical analysis, philosophical inference, and evaluation of the author's stance, irony, or subtextual intent — NOT mere literal recall.
   - Questions should test the reader's ability to interpret ambiguity, deduce implicit arguments, and assess rhetorical strategy.
   - "respuesta_correcta" must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "reading",
  "nivel": "C2",
  "tema": "${tema}",
  "texto": "First dense paragraph.\\n\\nSecond dense paragraph.\\n\\nThird dense paragraph.\\n\\nFourth dense paragraph.",
  "preguntas": [
${schemaPreguntas}
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
FORMAT RULE: Separate paragraphs with \\n\\n. Each paragraph: 3-5 sentences.
Return ONLY valid JSON: { "tipo": "reading", "nivel": "${nivel}", "tema": "${tema}", "texto": "...", "preguntas": [{ "pregunta": "...", "opciones": ["...","...","...","..."], "respuesta_correcta": "..." }] }
`;
        break;

    } // end switch

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a teacher who only communicates in English and provides structured JSON. CRITICAL RULE: The "texto" field in your JSON response MUST contain EXACTLY ${exactWordCount} words — no more, no less. Count the words meticulously before returning.`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.75,
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