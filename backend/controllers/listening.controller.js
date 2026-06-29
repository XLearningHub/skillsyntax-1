const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// FUNCION PARA LIMPIAR JSON
function limpiarJSON(texto) {
  return texto
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}


// GENERAR LISTENING
exports.generarListening = async (req, res) => {
  try {

    const { tema, nivel } = req.body;

    if (!tema || !nivel) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    let descripcionNivel = "";

    if (nivel === "A1") {
      descripcionNivel = "principiante. Usa frases muy cortas, vocabulario básico y estructura simple.";
    }
    else if (nivel === "A2") {
      descripcionNivel = "básico. Usa frases simples con vocabulario común.";
    }
    else if (nivel === "B1") {
      descripcionNivel = "intermedio. Usa conversaciones naturales con vocabulario cotidiano.";
    }
    else if (nivel === "B2") {
      descripcionNivel = "intermedio alto. Usa vocabulario más amplio, ideas más complejas y conversaciones más naturales.";
    }
    else if (nivel === "C1") {
      descripcionNivel = "avanzado. Usa vocabulario avanzado, ideas abstractas y lenguaje natural.";
    }
    else if (nivel === "C2") {
      descripcionNivel = "experto. Usa lenguaje complejo, natural y desafiante.";
    }

    // ── SWITCH DE NIVEL: cada nivel puede tener su propio super-prompt ──
    let prompt;

    switch (nivel) {

      // ─────────────────────────────────────────────
      // NIVEL A1 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'A1':
        prompt = `
You are a specialist English teacher for complete beginners (CEFR level A1).
Create a very simple LISTENING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise (text, questions, options, etc.) MUST be generated in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. The audio text (audio_texto) must be a short dialogue OR monologue of MAXIMUM 40 words.
2. Use ONLY Present Simple tense or the verb "To Be" (am / is / are).
3. Vocabulary must be A1 basic level DIRECTLY related to "${tema}". No idioms, no contractions.
4. Write EXACTLY 2 comprehension questions with 3 options each.
5. Options must be short (1 to 3 words). The correct answer must come from the audio text.
6. "correcta" field must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "opcion_multiple",
  "audio_texto": "Maximum 40 words. Only Present Simple or To Be. Only basic vocabulary about ${tema}.",
  "preguntas": [
    {
      "pregunta": "...",
      "opciones": ["...", "...", "..."],
      "correcta": "..."
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
Create a LISTENING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise (text, questions, options, etc.) MUST be generated in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. The audio text (audio_texto) must be a short dialogue OR monologue of EXACTLY 60 to 80 words. Count the words carefully.
2. Allowed grammar: Present Simple, Past Simple, and Future with "going to". No other tenses.
3. Vocabulary must be A2 level DIRECTLY related to "${tema}". No idioms, no complex expressions.
4. Write EXACTLY 3 comprehension questions with EXACTLY 3 short options each.
5. Options must be short (1 to 5 words). The correct answer must come directly from the audio text.
6. "correcta" field must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "opcion_multiple",
  "audio_texto": "60 to 80 words. Present/Past Simple or going to. A2 vocabulary about ${tema}.",
  "preguntas": [
    {
      "pregunta": "...",
      "opciones": ["...", "...", "..."],
      "correcta": "..."
    },
    {
      "pregunta": "...",
      "opciones": ["...", "...", "..."],
      "correcta": "..."
    },
    {
      "pregunta": "...",
      "opciones": ["...", "...", "..."],
      "correcta": "..."
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
Create a LISTENING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise MUST be generated in ENGLISH. If the topic '${tema}' is in Spanish or has typos, translate it to English internally. NO Spanish output.
1. The audio text (audio_texto) must be a dialogue OR monologue set in an everyday situation (travel, work, or school) related to "${tema}", of EXACTLY 100 to 130 words. Count the words carefully.
2. Allowed grammar: Present Simple, Past Simple, Future (will / going to), and Present Perfect. Natural conversational language is expected.
3. Vocabulary must be B1 level, related to "${tema}". Common phrasal verbs and connectors (however, although, because) are allowed.
4. Write EXACTLY 4 comprehension questions with EXACTLY 3 options each.
5. Questions must require understanding the context, not just identifying literal words from the audio.
6. "correcta" field must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "opcion_multiple",
  "audio_texto": "100 to 130 words. B1 vocabulary. Everyday situation related to ${tema}.",
  "preguntas": [
    {
      "pregunta": "...",
      "opciones": ["...", "...", "..."],
      "correcta": "..."
    },
    {
      "pregunta": "...",
      "opciones": ["...", "...", "..."],
      "correcta": "..."
    },
    {
      "pregunta": "...",
      "opciones": ["...", "...", "..."],
      "correcta": "..."
    },
    {
      "pregunta": "...",
      "opciones": ["...", "...", "..."],
      "correcta": "..."
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
Create a LISTENING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: Generate EVERYTHING in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. The audio text (audio_texto) must be a dialogue OR monologue of EXACTLY 150 to 180 words. Count the words carefully.
2. Use a natural, fluent register appropriate to "${tema}". Include B2-level vocabulary, phrasal verbs, and discourse markers (nevertheless, in contrast, on the other hand).
3. Grammar may include: Present Simple/Perfect/Continuous, Past Simple/Perfect, Future forms, passive voice, and conditionals.
4. Write EXACTLY 5 comprehension questions with EXACTLY 3 options each.
   - Questions must require understanding implied meaning, attitude, or purpose — not just literal recall.
   - "correcta" field must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "opcion_multiple",
  "audio_texto": "150 to 180 words. B2 vocabulary and discourse markers. Related to ${tema}.",
  "preguntas": [
    { "pregunta": "...", "opciones": ["...", "...", "..."], "correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "..."], "correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "..."], "correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "..."], "correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "..."], "correcta": "..." }
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
Create a LISTENING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: Generate EVERYTHING in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. The audio text (audio_texto) must be a monologue or formal dialogue of EXACTLY 200 words. Count the words carefully.
2. Use a sophisticated, academic or professional register appropriate to "${tema}". Include C1-level vocabulary, complex phrasal verbs, and advanced discourse markers (furthermore, notwithstanding, to that end, by extension).
3. Grammar may include: all tenses, complex conditionals, passive constructions, inversion, and nominalization.
4. Write EXACTLY 5 comprehension questions with EXACTLY 3 options each.
   - Questions MUST require inference, deduction, and interpretation of implied meaning — students cannot answer correctly by simple literal recall.
   - Questions should test the speaker's attitude, purpose, tone, and logical implications.
   - "correcta" field must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "opcion_multiple",
  "audio_texto": "200 words. C1 vocabulary and advanced discourse markers. Related to ${tema}.",
  "preguntas": [
    { "pregunta": "...", "opciones": ["...", "...", "..."], "correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "..."], "correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "..."], "correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "..."], "correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "..."], "correcta": "..." }
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
Create a LISTENING exercise strictly about the topic: "${tema}".

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise MUST be generated in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it internally. DO NOT output any Spanish words.
1. The audio text (audio_texto) must simulate a masterclass lecture, a high-level academic debate, or a technical interview of EXACTLY 200 to 250 words. Count the words carefully.
2. Use a highly sophisticated, native-level register with complex syntax, subtle irony, implicit arguments, and nuanced transitions (notwithstanding, by the same token, it stands to reason that, predicated upon, in contradistinction to).
3. Grammar must include: all tenses, complex conditionals, inversions, nominalization, passive voice, and cleft sentences.
4. Write EXACTLY 5 comprehension questions with EXACTLY 3 options each.
   - Questions MUST require understanding of abstract nuance, the speaker's attitude, implied intent, or rhetorical strategy — NOT literal recall.
   - Questions should probe the listener's ability to infer logical conclusions, evaluate tone, and detect underlying assumptions.
   - "correcta" field must match EXACTLY one of the options strings.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "tipo": "opcion_multiple",
  "audio_texto": "200 to 250 words. C2 native-level vocabulary, complex syntax, masterclass/debate/technical register. Related to ${tema}.",
  "preguntas": [
    { "pregunta": "...", "opciones": ["...", "...", "..."], "correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "..."], "correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "..."], "correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "..."], "correcta": "..." },
    { "pregunta": "...", "opciones": ["...", "...", "..."], "correcta": "..." }
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
Create a listening exercise for a student at level: ${nivel}.
TOPIC: ${tema}
Return ONLY valid JSON: { "tipo": "opcion_multiple", "audio_texto": "...", "preguntas": [{ "pregunta": "...", "opciones": ["...","...","..."], "correcta": "..." }] }
`;
        break;

    } // end switch

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    let contenido = response.output[0].content[0].text;
    contenido = limpiarJSON(contenido);

    let ejercicio;

try {
  ejercicio = JSON.parse(contenido);
} catch (e) {
  console.error("JSON inválido:", contenido);
  return res.status(500).json({
    error: "La IA devolvió un formato incorrecto"
  });
}

    ejercicio.nivel = nivel;

    // GENERAR AUDIO
    // GENERAR AUDIO
const audioResponse = await openai.audio.speech.create({
  model: "gpt-4o-mini-tts",
  voice: "alloy",
  input: ejercicio.audio_texto
});

// 🔥 ASEGURAR CARPETA
const dir = path.join(__dirname, "../public/audio");

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const fileName = `audio_${Date.now()}.mp3`;
const filePath = path.join(dir, fileName);

const buffer = Buffer.from(await audioResponse.arrayBuffer());

fs.writeFileSync(filePath, buffer);

// 👇 opcional pero recomendado para debug
console.log("Audio guardado en:", filePath);

    // URL relativa — funciona en local y producción sin cambios
    ejercicio.audio_url = `/audio/${fileName}`;

    res.json(ejercicio);

  } catch (error) {

    console.error("Error Listening:", error);

    res.status(500).json({
      error: "Error generando listening"
    });

  }
};



// CALIFICAR LISTENING
exports.calificarListening = async (req, res) => {

  try {

    const { ejercicio, respuestaUsuario } = req.body;

    if (!ejercicio || !respuestaUsuario) {
      return res.status(400).json({
        error: "Faltan datos para calificar"
      });
    }

    let correctas = 0;
    let detalle = [];

    function normalizar(texto) {
      return (texto || "")
        .toString()
        .trim()
        .toLowerCase();
    }

    // OPCION MULTIPLE
    if (ejercicio.tipo === "opcion_multiple") {

      ejercicio.preguntas.forEach((pregunta, index) => {

        let respuestaCorrectaTexto = pregunta.correcta;

        if (
          typeof pregunta.correcta === "string" &&
          ["a", "b", "c"].includes(normalizar(pregunta.correcta))
        ) {

          const indexCorrecto =
            normalizar(pregunta.correcta).charCodeAt(0) - 97;

          respuestaCorrectaTexto =
            pregunta.opciones[indexCorrecto];
        }

        const respuestaUser = respuestaUsuario[index];

        const esCorrecta =
          normalizar(respuestaCorrectaTexto) ===
          normalizar(respuestaUser);

        detalle.push(esCorrecta);

        if (esCorrecta) correctas++;

      });

    }

    // COMPLETAR
    if (ejercicio.tipo === "completar") {

      ejercicio.respuestas.forEach((respuesta, index) => {

        const respuestaUser = respuestaUsuario[index];

        const esCorrecta =
          normalizar(respuesta) ===
          normalizar(respuestaUser);

        detalle.push(esCorrecta);

        if (esCorrecta) correctas++;

      });

    }

    const total = detalle.length;

    const score =
      total > 0
        ? Math.round((correctas / total) * 100)
        : 0;


    // DESCRIPCION NIVEL
    let descripcionNivel = "";

    if (ejercicio.nivel === "A1")
      descripcionNivel = "beginner student";

    else if (ejercicio.nivel === "A2")
      descripcionNivel = "basic student";

    else if (ejercicio.nivel === "B1")
      descripcionNivel = "intermediate student";

    else if (ejercicio.nivel === "B2")
      descripcionNivel = "upper-intermediate student";

    else if (ejercicio.nivel === "C1")
      descripcionNivel = "advanced student";

    else if (ejercicio.nivel === "C2")
      descripcionNivel = "proficient student";


    // FEEDBACK IA
    const promptFeedback = `
You are a professional English teacher.

The student is a ${descripcionNivel}.

Score: ${score}%
Correct answers: ${correctas}/${total}

Write motivational and professional feedback.

Rules:

- Adapt to the student level
- Max 2 sentences
- Be encouraging
- Sound professional
- Return ONLY feedback text
`;

    const responseIA = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: promptFeedback
    });

    const feedback =
      responseIA.output[0].content[0].text.trim();


    res.json({
      score,
      correcto: score >= 70,
      feedback,
      detalle
    });

  } catch (error) {

    console.error("Error calificar listening:", error);

    res.status(500).json({
      error: "Error al calificar listening"
    });

  }

};