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


    // ── SWITCH DE NIVEL: cada nivel puede tener su propio super-prompt ──
    let prompt;

    switch (nivel) {

      // ─────────────────────────────────────────────
      // NIVEL A1 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'A1':
        prompt = `
You are a specialist English teacher for complete beginners (CEFR level A1).
Create a SURVIVAL ROLEPLAY exercise for speaking practice, strictly about the topic: "${tema}".

CONTEXT VARIETY DIRECTIVE (MANDATORY): The core topic for this exercise is strictly "${tema}". You MUST write about this topic, but generate a UNIQUE and highly specific real-world situation, perspective, or format for this generation. For example, if the topic is "Food", do not write a generic text about food; instead, write a restaurant review, a conversation about a grocery list, or a chef's interview. Vary the angle wildly on each request, but keep the content 100% logical, realistic, and strictly appropriate for CEFR level A1.

CEFR CONTEXT SCALING (A1 — MANDATORY): Since this is level A1, the situation MUST involve a very simple, familiar, everyday topic that a complete beginner would recognise immediately — for example: buying something at a shop, greeting a new classmate, asking for directions, or ordering food. Never use abstract concepts, professional jargon, or complex cultural references at this level.

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise (text, questions, options, etc.) MUST be generated in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. "escenario": Describe a very simple, real-life survival situation related to "${tema}" (max 2 sentences).
2. "objetivo": The student goal must be stated in 1 short sentence. Use simple words only.
3. "palabras_clave": Provide EXACTLY 5 common A1 words directly related to "${tema}". No compound words.
4. "frases_bot": Provide 3 example sentences the teacher/bot would say during the roleplay.
   - Each bot sentence must be MAXIMUM 5 words.
   - Use only Present Simple or To Be.
5. "respuestas_ejemplo": Provide 3 example student responses (very short, 3-5 words each) so the student knows what to say.
6. "reto_extra": One tiny extra challenge, max 1 sentence.
7. "texto_lectura": A short paragraph (2-3 simple sentences) for the student to read aloud. A1 vocabulary only.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "titulo": "...",
  "escenario": "...",
  "objetivo": "...",
  "palabras_clave": ["word1", "word2", "word3", "word4", "word5"],
  "frases_bot": ["Max 5 words.", "Max 5 words.", "Max 5 words."],
  "respuestas_ejemplo": ["3-5 words.", "3-5 words.", "3-5 words."],
  "reto_extra": "...",
  "texto_lectura": "..."
}
`;
        break;

      // ─────────────────────────────────────────────
      // NIVEL A2 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'A2':
        prompt = `
You are a specialist English teacher for elementary learners (CEFR level A2).
Create an EVERYDAY ROLEPLAY exercise for speaking practice, strictly about the topic: "${tema}".

CONTEXT VARIETY DIRECTIVE (MANDATORY): The core topic for this exercise is strictly "${tema}". You MUST write about this topic, but generate a UNIQUE and highly specific real-world situation, perspective, or format for this generation. For example, if the topic is "Food", do not write a generic text about food; instead, write a restaurant review, a conversation about a grocery list, or a chef's interview. Vary the angle wildly on each request, but keep the content 100% logical, realistic, and strictly appropriate for CEFR level A2.

CEFR CONTEXT SCALING (A2 — MANDATORY): Since this is level A2, the situation must be realistic and close to daily life — for example: a conversation at a café, making plans with a friend, talking about a recent trip, or describing a hobby. Slightly more detail than A1 but still very concrete and accessible. Never use abstract or academic themes.

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise (text, questions, options, etc.) MUST be generated in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. "escenario": Describe a simple, everyday real-life situation related to "${tema}" (2-3 sentences). Use A2 vocabulary.
2. "objetivo": The student goal stated in 1 clear sentence. Use simple words only.
3. "palabras_clave": Provide EXACTLY 5 A2-level words directly related to "${tema}".
4. "frases_bot": Provide 3 sentences the teacher/bot would say during the roleplay.
   - Each bot sentence must be MAXIMUM 10 words.
   - Use Present Simple, Past Simple, or "going to".
5. "respuestas_ejemplo": Provide 3 example student responses of 5 to 8 words each, so the student knows what to say.
6. "reto_extra": One short extra challenge, max 1 sentence.
7. "texto_lectura": A short paragraph (3-4 simple sentences) for the student to read aloud. A2 vocabulary only.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "titulo": "...",
  "escenario": "...",
  "objetivo": "...",
  "palabras_clave": ["word1", "word2", "word3", "word4", "word5"],
  "frases_bot": ["Max 10 words.", "Max 10 words.", "Max 10 words."],
  "respuestas_ejemplo": ["5-8 words.", "5-8 words.", "5-8 words."],
  "reto_extra": "...",
  "texto_lectura": "..."
}
`;
        break;

      // ─────────────────────────────────────────────
      // NIVEL B1 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'B1':
        prompt = `
You are a specialist English teacher for intermediate learners (CEFR level B1).
Create a ROLEPLAY speaking exercise for a student practicing travel, opinions, or problem-solving, strictly about the topic: "${tema}".

CONTEXT VARIETY DIRECTIVE (MANDATORY): The core topic for this exercise is strictly "${tema}". You MUST write about this topic, but generate a UNIQUE and highly specific real-world situation, perspective, or format for this generation. For example, if the topic is "Food", do not write a generic text about food; instead, write a restaurant review, a conversation about a grocery list, or a chef's interview. Vary the angle wildly on each request, but keep the content 100% logical, realistic, and strictly appropriate for CEFR level B1.

CEFR CONTEXT SCALING (B1 — MANDATORY): Since this is level B1, the situation should involve giving opinions, past experiences, or interpersonal problem-solving — for example: giving a recommendation, describing a travel mishap, debating a lifestyle choice, or complaining politely. Language can be more varied but must remain relatable and grounded in real everyday experience.

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise MUST be generated in ENGLISH. If the topic '${tema}' is in Spanish or has typos, translate it to English internally. NO Spanish output.
1. "escenario": Describe a real-world situation related to "${tema}" that involves giving an opinion, making a plan, or solving a travel/work problem (3-4 sentences). Use B1 vocabulary.
2. "objetivo": The student goal stated in 1-2 clear sentences. Include what they must express (opinion, plan, or solution).
3. "palabras_clave": Provide EXACTLY 5 B1-level words or expressions directly related to "${tema}".
4. "frases_bot": Provide 3 sentences the teacher/bot would say during the roleplay.
   - Each bot sentence must be MAXIMUM 15 words.
   - Use logical connectors: because, however, although, so, therefore.
5. "respuestas_ejemplo": Provide 3 example student responses of 8 to 12 words each.
6. "reto_extra": One extra challenge requiring the student to justify or expand an idea, max 1 sentence.
7. "texto_lectura": A short paragraph (3-5 sentences) for the student to read aloud. B1 vocabulary, natural and conversational tone.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "titulo": "...",
  "escenario": "...",
  "objetivo": "...",
  "palabras_clave": ["word1", "word2", "word3", "word4", "word5"],
  "frases_bot": ["Max 15 words with connectors.", "Max 15 words with connectors.", "Max 15 words with connectors."],
  "respuestas_ejemplo": ["8-12 words.", "8-12 words.", "8-12 words."],
  "reto_extra": "...",
  "texto_lectura": "..."
}
`;
        break;

      // ─────────────────────────────────────────────
      // NIVEL B2 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'B2':
        prompt = `
You are a specialist English teacher for upper-intermediate learners (CEFR level B2).
Create a DEBATE ROLEPLAY speaking exercise strictly about the topic: "${tema}".

CONTEXT VARIETY DIRECTIVE (MANDATORY): The core topic for this exercise is strictly "${tema}". You MUST write about this topic, but generate a UNIQUE and highly specific real-world situation, perspective, or format for this generation. For example, if the topic is "Food", do not write a generic text about food; instead, write a restaurant review, a conversation about a grocery list, or a chef's interview. Vary the angle wildly on each request, but keep the content 100% logical, realistic, and strictly appropriate for CEFR level B2.

CEFR CONTEXT SCALING (B2 — MANDATORY): Since this is level B2, the situation should involve argumentation or structured debate — for example: defending a position in a discussion, analysing pros and cons of a trend, debating a social or environmental issue, or negotiating in a professional context. The context can be professional or semi-academic. Avoid overly simple scenarios.

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: Generate EVERYTHING in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. "escenario": Describe a complex, real-world problem or controversial situation related to "${tema}" (3-4 sentences). The student must debate, argue a position, or propose a solution.
2. "objetivo": The student goal stated in 1-2 clear sentences. They must express a clear opinion and support it with arguments.
3. "palabras_clave": Provide EXACTLY 5 B2-level words or expressions directly related to "${tema}".
4. "frases_bot": Provide 3 sentences the teacher/bot would say to challenge or debate with the student.
   - Each bot sentence must be MAXIMUM 20 words.
   - Use debate connectors: however, on the other hand, I would argue that, nevertheless.
5. "respuestas_ejemplo": Provide 3 example student responses of 12 to 15 words each, demonstrating how to argue a position.
6. "reto_extra": One extra challenge requiring the student to counter-argue or provide evidence, max 1 sentence.
7. "texto_lectura": A paragraph (4-5 sentences) related to the debate topic for the student to read aloud. B2 vocabulary with argumentation language.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "titulo": "...",
  "escenario": "...",
  "objetivo": "...",
  "palabras_clave": ["word1", "word2", "word3", "word4", "word5"],
  "frases_bot": ["Max 20 words with debate connectors.", "Max 20 words with debate connectors.", "Max 20 words with debate connectors."],
  "respuestas_ejemplo": ["12-15 words.", "12-15 words.", "12-15 words."],
  "reto_extra": "...",
  "texto_lectura": "..."
}
`;
        break;

      // ─────────────────────────────────────────────
      // NIVEL C1 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'C1':
        prompt = `
You are a specialist English teacher for advanced learners (CEFR level C1).
Create a PROFESSIONAL NEGOTIATION or THESIS DEFENCE ROLEPLAY exercise for speaking practice, strictly about the topic: "${tema}".

CONTEXT VARIETY DIRECTIVE (MANDATORY): The core topic for this exercise is strictly "${tema}". You MUST write about this topic, but generate a UNIQUE and highly specific real-world situation, perspective, or format for this generation. For example, if the topic is "Food", do not write a generic text about food; instead, write a restaurant review, a conversation about a grocery list, or a chef's interview. Vary the angle wildly on each request, but keep the content 100% logical, realistic, and strictly appropriate for CEFR level C1.

CEFR CONTEXT SCALING (C1 — MANDATORY): Since this is level C1, the situation should involve complex, abstract, or high-stakes professional themes — for example: a thesis defence, a corporate negotiation, arguing a policy position, or evaluating an ethical dilemma. Language and context must be sophisticated and intellectually demanding. Avoid simple or everyday scenarios.

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: Generate EVERYTHING in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it to English internally. DO NOT output any Spanish words.
1. "escenario": Describe a high-stakes professional negotiation, academic defence, or formal debate situation related to "${tema}" (4-5 sentences). The student must present, defend, or negotiate a sophisticated position.
2. "objetivo": The student goal stated in 2 clear sentences. They must demonstrate nuanced argumentation, logical structure, and C1-level fluency.
3. "palabras_clave": Provide EXACTLY 5 C1-level sophisticated expressions or collocations directly related to "${tema}".
4. "frases_bot": Provide 3 sentences the teacher/bot would say to push back, negotiate, or probe the student's reasoning.
   - Each bot sentence must be MAXIMUM 25 words.
   - Use advanced connectors: furthermore, nevertheless, notwithstanding, it stands to reason that, by extension, in light of this.
5. "respuestas_ejemplo": Provide 3 example student responses of 15 to 20 words each, demonstrating sophisticated argumentation and academic language.
6. "reto_extra": One advanced extra challenge requiring the student to synthesise multiple arguments or propose a nuanced compromise, max 1 sentence.
7. "texto_lectura": A paragraph (5-6 sentences) at C1 level for the student to read aloud. Must include formal register, complex syntax, and advanced vocabulary.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "titulo": "...",
  "escenario": "...",
  "objetivo": "...",
  "palabras_clave": ["expr1", "expr2", "expr3", "expr4", "expr5"],
  "frases_bot": ["Max 25 words with advanced connectors.", "Max 25 words with advanced connectors.", "Max 25 words with advanced connectors."],
  "respuestas_ejemplo": ["15-20 words.", "15-20 words.", "15-20 words."],
  "reto_extra": "...",
  "texto_lectura": "..."
}
`;
        break;

      // ─────────────────────────────────────────────
      // NIVEL C2 — SÚPER-PROMPT ESPECIALIZADO
      // ─────────────────────────────────────────────
      case 'C2':
        prompt = `
You are a specialist English teacher for proficiency/mastery learners (CEFR level C2).
Create a PHILOSOPHICAL DEBATE, ETHICAL DILEMMA, or HIGH-STAKES DIPLOMATIC NEGOTIATION ROLEPLAY exercise for speaking practice, strictly about the topic: "${tema}".

CONTEXT VARIETY DIRECTIVE (MANDATORY): The core topic for this exercise is strictly "${tema}". You MUST write about this topic, but generate a UNIQUE and highly specific real-world situation, perspective, or format for this generation. For example, if the topic is "Food", do not write a generic text about food; instead, write a restaurant review, a conversation about a grocery list, or a chef's interview. Vary the angle wildly on each request, but keep the content 100% logical, realistic, and strictly appropriate for CEFR level C2.

CEFR CONTEXT SCALING (C2 — MANDATORY): Since this is level C2, the situation must be intellectually and philosophically challenging — for example: a philosophical paradox, a diplomatic negotiation between opposing ideologies, an ethical debate with no clear answer, or a rhetorical critique. Expect near-native complexity and mastery. Never use simple or concrete everyday scenarios.

ABSOLUTE RULES — follow every rule without exception:
0. STRICT LANGUAGE RULE: The ENTIRE exercise MUST be generated in ENGLISH. If the topic '${tema}' is written in Spanish or has typos, translate it internally. DO NOT output any Spanish words.
1. "escenario": Describe an extraordinarily complex philosophical, ethical, or diplomatic situation directly related to "${tema}" (5-6 sentences). The student must defend a nuanced position, mediate competing ideologies, or present a morally ambiguous argument at C2 level.
2. "objetivo": The student goal stated in 2 clear sentences. They must demonstrate masterful argumentation, epistemic sophistication, and complete C2 fluency.
3. "palabras_clave": Provide EXACTLY 5 C2-level mastery expressions, collocations, or philosophical terms directly related to "${tema}".
4. "frases_bot": Provide 3 sentences the teacher/bot would say to provoke, refute, or challenge the student at the highest philosophical or diplomatic level.
   - Each bot sentence must be MAXIMUM 30 words.
   - Use diplomatic or academic language: it would be remiss not to acknowledge, predicated upon the assumption that, one might argue, yet the evidence is equivocal.
5. "respuestas_ejemplo": Provide 3 example student responses of 20 to 25 words each, demonstrating how to structure complex philosophical arguments or diplomatic rebuttals.
6. "reto_extra": One supreme extra challenge requiring the student to synthesise contradictory positions or propose a paradigm-shifting compromise, max 1 sentence.
7. "texto_lectura": A dense paragraph (6-7 sentences) at C2 level for the student to read aloud. Must include philosophical register, complex syntax, embedded clauses, and advanced vocabulary.

Return ONLY valid JSON in this EXACT format — no markdown, no extra text:
{
  "titulo": "...",
  "escenario": "...",
  "objetivo": "...",
  "palabras_clave": ["expr1", "expr2", "expr3", "expr4", "expr5"],
  "frases_bot": ["Max 30 words. Diplomatic/academic language.", "Max 30 words. Diplomatic/academic language.", "Max 30 words. Diplomatic/academic language."],
  "respuestas_ejemplo": ["20-25 words.", "20-25 words.", "20-25 words."],
  "reto_extra": "...",
  "texto_lectura": "..."
}
`;
        break;

      // ─────────────────────────────────────────────
      // DEFAULT — fallback genérico de seguridad
      // ─────────────────────────────────────────────
      default:
        prompt = `
You are an expert English teacher specialized in the CEFR standard.
Create a speaking roleplay exercise for a student at level: ${nivel}.
TOPIC: ${tema}
Return ONLY valid JSON: { "titulo": "...", "escenario": "...", "objetivo": "...", "palabras_clave": ["w1","w2","w3","w4","w5"], "frases_bot": ["...","...","..."], "respuestas_ejemplo": ["...","...","..."], "reto_extra": "...", "texto_lectura": "..." }
`;
        break;

    } // end switch

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.75
    });

    let contenido = response.choices[0].message.content.replace(/```json/g, "").replace(/```/g, "").trim();
    let speaking = JSON.parse(contenido);
    
    speaking.nivel = nivel;
    speaking.instruccion = speaking.objetivo;
    speaking.fluency = speaking.escenario;

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
          content: `You are a professional, fair, and encouraging English teacher evaluating a speaking exercise.
          The student is at CEFR level: ${datosEjercicio.nivel || 'B1'}.

          Exercise context:
          1. Scenario: "${datosEjercicio.escenario}"
          2. Goal: "${datosEjercicio.objetivo}"
          3. Key words: ${datosEjercicio.palabras_clave.join(", ")}

          EVALUATION RULES:
          - Be fair and calibrate your score to the student's CEFR level. A beginner (A1/A2) making small grammar mistakes should still score well if they communicated the idea.
          - Only apply a very low score (below 40) if the student's response is 100% completely irrelevant to the scenario — for example, talking about a totally unrelated topic or saying nothing meaningful.
          - Reward effort, relevant vocabulary use, and communication of the main idea even if grammar is imperfect.
          - Evaluate: pronunciation clarity, grammar for the level, use of keywords, and relevance to the scenario.

          Respond ONLY in JSON:
          {
            "score": (0-100),
            "pronunciation_feedback": "brief comment on clarity",
            "grammar_feedback": "brief comment on grammar appropriate for the CEFR level",
            "keywords_used": (how many of the 5 key words were used),
            "final_feedback": "motivating summary in English"
          }`
        },
        { role: "user", content: textoUsuario }
      ],
      temperature: 0.3
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