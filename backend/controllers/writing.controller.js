const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function limpiar(texto) {
  return (texto || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

const sinonimos = {
  many: ["much", "a lot of"],
  best: ["close", "good"],
  easy: ["simple"],
  modern: ["new", "current"]
};

// GENERAR WRITING
exports.generarWriting = async (req, res) => {
  try {
    const tema = req.body.tema || req.body.topic || "daily life";
    const nivel = req.body.nivel || "A1";

    // ── SWITCH DE NIVEL: cada nivel puede tener su propio super-prompt ──
    let prompt;

    switch (nivel) {

      // ─────────────────────────────────────────────
      // NIVEL A1 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'A1':
        prompt = `
You are a specialist English teacher for complete beginners (CEFR level A1).
Create a simple WRITING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise (text, questions, options, etc.) MUST be generated in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. The exercise must have EXACTLY 3 fill-in-the-blank spaces (____). No more, no less.
2. Each blank must be filled with ONE single basic A1 word DIRECTLY related to "${tema}".
3. Use ONLY Present Simple tense or the verb "To Be". No compound words, no idioms.
4. Provide 3 keyword helpers ("palabras") to help the student — these must be the same 3 answer words.
5. The text must feel like a student writing 3 simple sentences about "${tema}" using the provided words.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "fill_blanks",
  "texto": "Sentence with ____ and more ____ and also ____.",
  "palabras": ["word1", "word2", "word3"],
  "respuestas": ["word1", "word2", "word3"]
}
`;
        break;

      // ─────────────────────────────────────────────
      // NIVEL A2 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'A2':
        prompt = `
You are a specialist English teacher for elementary learners (CEFR level A2).
Create a WRITING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise (text, questions, options, etc.) MUST be generated in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it internally. DO NOT output any Spanish words.
1. The exercise must have EXACTLY 5 fill-in-the-blank spaces (____). No more, no less.
2. Each blank must be filled with ONE single A2-level word DIRECTLY related to "${tema}".
3. Allowed grammar: Present Simple, Past Simple, and Future with "going to". No idioms.
4. Provide EXACTLY 5 keyword helpers ("palabras") — these must be the same 5 answer words.
5. The text must feel natural and coherent, forming a short paragraph or 3-5 connected sentences about "${tema}".

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "fill_blanks",
  "texto": "Sentence with ____ and more ____ text ____ and also ____ finishing ____.",
  "palabras": ["word1", "word2", "word3", "word4", "word5"],
  "respuestas": ["word1", "word2", "word3", "word4", "word5"]
}
`;
        break;

      // ─────────────────────────────────────────────
      // NIVEL B1 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'B1':
        prompt = `
You are a specialist English teacher for intermediate learners (CEFR level B1).
Create a WRITING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise MUST be generated in ENGLISH. If the topic '${tema}' is in Spanish or has typos, translate it internally. NO Spanish output.
1. The exercise must have EXACTLY 7 fill-in-the-blank spaces (____). No more, no less.
2. Each blank must be filled with ONE B1-level word DIRECTLY related to "${tema}". Words may include irregular verbs (went, bought, seen) or connectors (although, however, because).
3. Allowed grammar: Present Simple, Past Simple, Future (will / going to), Present Perfect. Natural and correct English.
4. Provide EXACTLY 7 keyword helpers ("palabras") — these must be the same 7 answer words.
5. The text must form a coherent paragraph or short passage (4-6 sentences) about "${tema}". No bullet points or numbered lists.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "fill_blanks",
  "texto": "Text with ____ and more ____ and ____ and also ____ then ____ and ____ finally ____.",
  "palabras": ["word1", "word2", "word3", "word4", "word5", "word6", "word7"],
  "respuestas": ["word1", "word2", "word3", "word4", "word5", "word6", "word7"]
}
`;
        break;

      // ─────────────────────────────────────────────
      // NIVEL B2 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'B2':
        prompt = `
You are a specialist English teacher for upper-intermediate learners (CEFR level B2).
Create a WRITING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: Generate EVERYTHING in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. The exercise must have EXACTLY 8 fill-in-the-blank spaces (____). No more, no less.
2. Each blank must be filled with ONE B2-level keyword DIRECTLY related to "${tema}". Include a mix of: academic/formal vocabulary, phrasal verbs (e.g., carry out, give rise to), and connectors (nevertheless, consequently, whereas).
3. Grammar may include: passive voice, conditionals, present/past perfect, and complex noun phrases.
4. Provide EXACTLY 8 keyword helpers ("palabras") — these must be the same 8 answer words.
5. The text must form a coherent passage (5-7 sentences) about "${tema}". No bullet points or numbered lists. The overall tone should be semi-formal or informative.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "fill_blanks",
  "texto": "Text with ____ and ____ and ____ and ____ and ____ and ____ and ____ and ____.",
  "palabras": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8"],
  "respuestas": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8"]
}
`;
        break;

      // ─────────────────────────────────────────────
      // NIVEL C1 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'C1':
        prompt = `
You are a specialist English teacher for advanced learners (CEFR level C1).
Create a WRITING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: Generate EVERYTHING in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. The exercise must have EXACTLY 10 fill-in-the-blank spaces (____). No more, no less.
2. Each blank must be filled with ONE C1-level sophisticated keyword DIRECTLY related to "${tema}". Use nuanced vocabulary: advanced collocations, formal/academic terms, complex phrasal verbs (e.g., bring about, account for, give rise to), nominalisations (e.g., implementation, proliferation), and precise connectors (notwithstanding, by extension, in light of this).
3. Grammar may include: complex conditionals, inversions, cleft sentences, passive constructions, and advanced noun phrases.
4. Provide EXACTLY 10 keyword helpers ("palabras") — these must be the same 10 answer words.
5. The text must form a coherent, sophisticated passage (6-8 sentences) about "${tema}". It must have an academic or professional tone. No bullet points or numbered lists.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "fill_blanks",
  "texto": "Text with ____ and ____ and ____ and ____ and ____ and ____ and ____ and ____ and ____ and ____.",
  "palabras": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8", "word9", "word10"],
  "respuestas": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8", "word9", "word10"]
}
`;
        break;

      // ─────────────────────────────────────────────
      // NIVEL C2 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'C2':
        prompt = `
You are a specialist English teacher for proficiency/mastery learners (CEFR level C2).
Create a WRITING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise MUST be generated in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it internally. DO NOT output any Spanish words.
1. The exercise must have EXACTLY 10 fill-in-the-blank spaces (____). No more, no less.
2. Each blank must be filled with ONE C2-level mastery keyword DIRECTLY related to "${tema}". Use the most sophisticated vocabulary available: rare collocations, philosophical or technical terms, literary expressions, and precise rhetorical connectors (e.g., 'ubiquitous', 'ephemeral', 'mitigate', 'predicated', 'inexorable', 'paradigmatic', 'equivocal', 'hegemonic', 'ostensibly', 'dialectical').
3. Grammar must include: cleft sentences, complex inversions, philosophical abstractions, dense nominalization, and embedded relative clauses.
4. Provide EXACTLY 10 C2-level keyword helpers ("palabras") — these must be the same 10 answer words. Each word should be at the C2 mastery level.
5. The text must form a highly sophisticated, dense passage (7-9 sentences) about "${tema}". It must have a philosophical, literary, or academic tone. No bullet points or numbered lists.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "fill_blanks",
  "texto": "Dense text with ____ and ____ and ____ and ____ and ____ and ____ and ____ and ____ and ____ and ____.",
  "palabras": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8", "word9", "word10"],
  "respuestas": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8", "word9", "word10"]
}
`;
        break;

      // ─────────────────────────────────────────────
      // DEFAULT — fallback genérico de seguridad
      // ─────────────────────────────────────────────
      default:
        prompt = `
You are an expert English teacher specialized in the CEFR standard.
Create a writing fill-in-the-blanks exercise for a student at level: ${nivel}.
TOPIC: ${tema}
Return ONLY valid JSON: { "tipo": "fill_blanks", "texto": "...", "palabras": ["w1","w2","w3"], "respuestas": ["w1","w2","w3"] }
`;
        break;

    } // end switch

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "Eres un generador de ejercicios de inglés. Respondes SOLO JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6
    });

    let contenido = response.choices?.[0]?.message?.content;

    if (!contenido) {
      return res.status(500).json({ error: "No se generó contenido" });
    }

    console.log("RESPUESTA IA:", contenido);

    contenido = contenido
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let ejercicio;

    try {
      ejercicio = JSON.parse(contenido);
    } catch (err) {
      console.error("Error parseando JSON:", err);
      return res.status(500).json({
        error: "La IA no devolvió JSON válido"
      });
    }

    // La cantidad de blancos varía por nivel: A1=3, A2=5, B1=7, B2=8, C1=10, resto=12
    const blancosEsperados = nivel === 'A1' ? 3 : nivel === 'A2' ? 5 : nivel === 'B1' ? 7 : nivel === 'B2' ? 8 : nivel === 'C1' ? 10 : nivel === 'C2' ? 10 : 10;

    if (
      !ejercicio.texto ||
      !Array.isArray(ejercicio.palabras) ||
      !Array.isArray(ejercicio.respuestas) ||
      ejercicio.palabras.length !== blancosEsperados ||
      ejercicio.respuestas.length !== blancosEsperados
    ) {
      return res.status(500).json({
        error: "Formato inválido generado por la IA"
      });
    }

    ejercicio.respuestas = [...ejercicio.palabras];

    ejercicio.nivel = nivel;

    res.json(ejercicio);

  } catch (error) {
    console.error("Error Writing:", error);

    res.status(500).json({
      error: "Error generando writing"
    });
  }
};


// CALIFICAR WRITING
exports.calificarWriting = async (req, res) => {
  try {
    const { ejercicio, respuestaUsuario } = req.body;

    if (!ejercicio || !respuestaUsuario) {
      return res.status(400).json({
        error: "Faltan datos para calificar"
      });
    }

    let correctas = 0;
    let detalle = [];

    const respuestasCorrectas = ejercicio.respuestas || [];
    const respuestasUser = respuestaUsuario || [];

    const total = Math.min(
      respuestasCorrectas.length,
      respuestasUser.length
    );

    for (let i = 0; i < total; i++) {
      const correcta = limpiar(respuestasCorrectas[i]);
      const usuario = limpiar(respuestasUser[i]);

      let esCorrecta = correcta === usuario;

      if (!esCorrecta && sinonimos[correcta]) {
        esCorrecta = sinonimos[correcta].includes(usuario);
      }

      detalle.push({
        correcta,
        usuario,
        esCorrecta
      });

      if (esCorrecta) correctas++;
    }

    const score = total > 0
      ? Math.round((correctas / total) * 100)
      : 0;

    // FEEDBACK IA
    const promptFeedback = `
You are an English teacher.

Writing level: ${ejercicio.nivel}
Score: ${score}/100

Correct answers: ${correctas}
Total blanks: ${total}

Student answers:
${JSON.stringify(respuestaUsuario)}

Correct answers:
${JSON.stringify(ejercicio.respuestas)}

Write short professional feedback (max 2 sentences).
Be encouraging and helpful.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are a helpful English teacher." },
        { role: "user", content: promptFeedback }
      ]
    });

    const feedback =
      response.choices?.[0]?.message?.content?.trim() || "Good job!";

    res.json({
      score,
      correcto: score >= 70,
      feedback,
      detalle
    });

  } catch (error) {
    console.error("Error calificar writing:", error);

    res.status(500).json({
      error: "Error al calificar writing"
    });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// GENERAR PROMPT DE EXAMEN  ·  POST /api/writing/generate-prompt
// ─────────────────────────────────────────────────────────────────────────────
exports.generateWritingPrompt = async (req, res) => {
  try {
    const { tema, nivelCEFR } = req.body;

    if (!tema || !nivelCEFR) {
      return res.status(400).json({ error: "Faltan datos: tema y nivelCEFR son requeridos." });
    }

    // ── Límites de palabras por nivel CEFR ───────────────────────────────────
    const wordLimits = {
      A1: { min: 30,  max: 50  },
      A2: { min: 80,  max: 100 },
      B1: { min: 150, max: 200 },
      B2: { min: 250, max: 300 },
      C1: { min: 350, max: 400 },
      C2: { min: 500, max: 600 }
    };
    const wl = wordLimits[nivelCEFR] || { min: 80, max: 100 };

    // ── Ejemplos de referencia por nivel ─────────────────────────────────────
    const ejemplos = {
      A1: `You just moved to a new house. Write a short message to a friend telling them about your new home and one thing you like about it. (Write between 30 and 50 words.)`,
      A2: `Your neighbour's dog keeps you awake at night. Write a note to your neighbour explaining the problem and asking them to help. (Write between 80 and 100 words.)`,
      B1: `You went on a trip last month and something unexpected happened. Write a post for your travel blog describing what happened and how you felt. (Write between 150 and 200 words.)`,
      B2: `A local newspaper has asked readers to share their opinion on whether people should be allowed to work from home permanently. Write your response giving your views and supporting them with reasons. (Write between 250 and 300 words.)`,
      C1: `A philosophy journal has invited contributors to examine how modern technology is reshaping the concept of personal identity. Write a structured argument presenting your position. (Write between 350 and 400 words.)`,
      C2: `Consider the paradox that absolute freedom may be the greatest threat to human flourishing. Write a critical commentary evaluating this claim from philosophical, political, and ethical perspectives. (Write between 500 and 600 words.)`
    };

    const ejemplo = ejemplos[nivelCEFR] || ejemplos["B1"];

    // ── Perfil de complejidad por grupo de nivel ──────────────────────────────
    const levelGuidance = {
      A1: "LEVEL A1 — Scenarios must involve very simple, familiar, everyday topics (e.g. food, family, home, daily routine, greetings). The situation must be immediately understandable for a complete beginner. Keep the vocabulary and context extremely basic.",
      A2: "LEVEL A2 — Scenarios must be realistic and close to daily life (e.g. sending a message to a friend, describing a place, talking about plans or past events). Slightly more detail than A1 but still very concrete and accessible.",
      B1: "LEVEL B1 — Scenarios may involve opinions, past experiences, or interpersonal situations (e.g. giving a review, recounting an anecdote, expressing a preference, writing an informal complaint). Language can be more varied but context must remain relatable.",
      B2: "LEVEL B2 — Scenarios should involve argumentation, analysis, or structured opinion (e.g. debating a social issue, writing a formal letter, analysing a trend or problem). Context can be professional or semi-academic.",
      C1: "LEVEL C1 — Scenarios should involve complex, abstract, or academic themes (e.g. analysing a philosophical concept, arguing a professional position, evaluating a policy or ethical dilemma). Language and context must be sophisticated.",
      C2: "LEVEL C2 — Scenarios must be intellectually challenging and nuanced (e.g. philosophical paradoxes, rhetorical analysis, cross-disciplinary debates, critique of socio-political systems). Expect near-native critical thinking."
    };

    const guidance = levelGuidance[nivelCEFR] || levelGuidance["B1"];

    const systemPrompt = `You are an experienced Cambridge and TOEFL writing examiner.
Your task is to generate ONE original writing task instruction for a student.

STRICT RULES — follow every rule without exception:
1. ${guidance}
2. The scenario must be directly related to the topic: "${tema}".
3. The instruction must describe a clear situation that the student should write about (e.g. who they are, what happened, what they need to write).
4. The instruction must be 2 to 3 sentences long and feel natural and realistic for the level.
5. MANDATORY WORD COUNT: At the very end of your response, you MUST append exactly this phrase (replacing X and Y with the correct numbers): "(Write between ${wl.min} and ${wl.max} words.)" — this phrase must always appear as the last part of your output, with no text after it.
6. Do NOT include labels, headers, JSON, or any extra text — return ONLY the instruction itself followed by the word-count phrase.
7. Vary the type of scenario each time (e.g. emails, blog posts, letters, personal stories, reviews, arguments, reflections) — avoid repeating the same format.

EXAMPLE of the expected output style for level ${nivelCEFR}:
"${ejemplo}"`;

    const userPrompt = `Generate a writing task instruction for CEFR level ${nivelCEFR} about the topic: "${tema}".`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   }
      ],
      temperature: 0.75,
      max_tokens: 200
    });

    const prompt = response.choices?.[0]?.message?.content?.trim();

    if (!prompt) {
      return res.status(500).json({ error: "La IA no generó una instrucción." });
    }

    console.log(`[generateWritingPrompt] Level=${nivelCEFR} | Topic="${tema}" | Prompt="${prompt.substring(0,80)}..."`);

    res.json({ prompt });

  } catch (error) {
    console.error("Error generateWritingPrompt:", error);
    res.status(500).json({ error: "Error al generar la instrucción de escritura." });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// EVALUAR REDACCIÓN LIBRE  ·  POST /api/writing/evaluate
// ─────────────────────────────────────────────────────────────────────────────
exports.evaluateWriting = async (req, res) => {

  try {
    const { texto, nivelCEFR, tema } = req.body;

    if (!texto || !nivelCEFR || !tema) {
      return res.status(400).json({
        error: "Faltan datos: texto, nivelCEFR y tema son requeridos."
      });
    }

    // ── MAPA DE EXPECTATIVAS POR NIVEL ───────────────────────────────────────
    const levelProfiles = {
      A1: "The student is a complete beginner. Expect very simple sentences, basic vocabulary, and frequent errors. Evaluate with kindness but mark clear mistakes.",
      A2: "The student is elementary. Expect short paragraphs, basic connectors, and some errors in tense or agreement.",
      B1: "The student is intermediate. Expect developed paragraphs, use of connectors, and reasonable control of Past and Present tenses.",
      B2: "The student is upper-intermediate. Expect coherent essays, varied vocabulary, passive constructions, and conditionals.",
      C1: "The student is advanced. Expect sophisticated vocabulary, complex grammar, academic register, and well-structured argumentation.",
      C2: "The student is at mastery level. Expect near-native fluency, nuanced expression, rhetorical devices, and masterful cohesion."
    };

    const profile = levelProfiles[nivelCEFR] || levelProfiles["B1"];

    // ── SYSTEM PROMPT — EXAMINADOR ESTRICTO ──────────────────────────────────
    const systemPrompt = `You are a strict, experienced native English examiner with the standards of Cambridge IELTS and TOEFL iBT.
Your role is to evaluate a student's free-writing submission with absolute professional rigour.

OFF-TOPIC RULE:
- Apply the off-topic penalty (Task Achievement = 0, total score capped at 40) ONLY if the student's text is 100% completely unrelated to the core subject of the assigned task — for example, writing about a wholly different topic or submitting nonsense/placeholder text.
- DO NOT penalize or mark as OFF-TOPIC if the student forgets structural formatting such as email headers (To:, From:, Subject:), formal letter greetings, or document titles. As long as the core message and vocabulary address the requested topic, the student passes Task Achievement — missing format elements are minor deductions under Coherence, not grounds for an off-topic penalty.
- If the student addresses the main topic, even in a creative, unexpected, or imperfect way, evaluate them fairly using the CEFR ${nivelCEFR} rubric WITHOUT applying any off-topic penalty.
- When the off-topic penalty IS applied, include this warning at the START of the "feedback" field: "⚠️ OFF-TOPIC WARNING: Your response does not address the assigned task. Task Achievement has been scored 0. No matter how grammatically accurate your writing is, the overall score cannot exceed 40 when the task is ignored."

EVALUATION CRITERIA (weight each equally):
1. Grammar accuracy — verb tenses, subject-verb agreement, articles, prepositions.
2. Vocabulary range and appropriacy — word choice for the CEFR level.
3. Coherence and cohesion — logical flow, use of connectors, paragraph organisation.
4. Task achievement — how well the student addressed the assigned topic AND scenario.

STUDENT LEVEL CONTEXT: ${profile}

SCORING SCALE (0–100):
- 90–100: Near-native / flawless for the level.
- 75–89: Strong performance with minor errors.
- 60–74: Satisfactory, clear weak areas.
- 45–59: Below expected level, significant errors.
- 0–44: Poor, fundamental problems.

OUTPUT FORMAT — return ONLY valid JSON, no markdown, no extra text:
{
  "score": <integer 0-100>,
  "feedback": "<2-4 sentences of professional overall commentary in English>",
  "corrections": [
    {
      "original": "<exact phrase or sentence from student text that contains an error>",
      "correction": "<corrected version of that phrase or sentence>",
      "reason": "<concise grammatical or stylistic explanation in English>"
    }
  ]
}

RULES:
- "corrections" must contain ONLY real errors found in the student's text.
- If the text is flawless, return an empty array: "corrections": [].
- Do NOT invent errors that do not exist.
- "original" must be a verbatim excerpt from the student text.
- Limit corrections to the most important ones (max 8).`;

    // ── USER PROMPT ───────────────────────────────────────────────────────────
    const userPrompt = `CEFR Level: ${nivelCEFR}
Topic assigned: "${tema}"

Student's submission:
"""
${texto.trim()}
"""

Evaluate the above submission strictly following the instructions and return valid JSON only.`;

    // ── LLAMADA A OPENAI ──────────────────────────────────────────────────────
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    let rawContent = response.choices?.[0]?.message?.content;

    if (!rawContent) {
      return res.status(500).json({ error: "La IA no devolvió contenido." });
    }

    // Limpieza defensiva (por si acaso lleva markdown)
    rawContent = rawContent
      .replace(/```json/g, "")
      .replace(/```/g,     "")
      .trim();

    let evaluation;
    try {
      evaluation = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error("JSON inválido de OpenAI:", rawContent);
      return res.status(500).json({ error: "Formato de respuesta inválido de la IA." });
    }

    // Validación estructural mínima
    if (
      typeof evaluation.score        !== "number"  ||
      typeof evaluation.feedback     !== "string"  ||
      !Array.isArray(evaluation.corrections)
    ) {
      return res.status(500).json({ error: "La IA devolvió una estructura JSON incompleta." });
    }

    // Asegurar rango del score
    evaluation.score = Math.max(0, Math.min(100, Math.round(evaluation.score)));

    console.log(`[evaluateWriting] Level=${nivelCEFR} | Score=${evaluation.score} | Corrections=${evaluation.corrections.length}`);

    res.json(evaluation);

  } catch (error) {
    console.error("Error evaluateWriting:", error);
    res.status(500).json({ error: "Error al evaluar la redacción." });
  }
};