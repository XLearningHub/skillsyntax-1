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