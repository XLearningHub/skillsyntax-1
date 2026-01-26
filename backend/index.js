const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const OpenAI = require("openai");
const path = require("path");
require("dotenv").config();

//  Iniciar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

//  Iniciar Express
const app = express();
app.use(cors());
app.use(express.json());

//  Rutas especificas
const readingRoutes = require("./routes/reading.routes");
const listeningRoutes = require("./routes/listening.routes");
const speakingRoutes = require("./routes/speaking.routes");
const writingRoutes = require("./routes/writing.routes");

app.use("/api", readingRoutes);
app.use("/api", listeningRoutes);
app.use("/api", speakingRoutes);
app.use("/api", writingRoutes);

//  Conexión a Firebase
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


// RUTAS DE PRUEBA

// Ruta raíz
app.get("/", (req, res) => {
  res.send("Backend SkillSyntax AI funcionando correctamente");
});

// Conexion con frontend
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/test.html"));
});

// Probar conexión con OpenAI
app.get("/test_openai", async (req, res) => {
  try {
    await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Responde solo con: OK" }],
      max_tokens: 5
    });

    res.json({ mensaje: "Conexión con OpenAI exitosa" });

  } catch (error) {
    console.error("Error OpenAI:", error);
    res.status(500).json({ error: "Error conectando con OpenAI" });
  }
});


// API GENERAR LECCIÓN

app.post("/generar_leccion", async (req, res) => {
  try {
    const { tema, nivel } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Genera una lección sobre ${tema} para nivel ${nivel}. Incluye teoría, ejemplos y ejercicios prácticos.`
      }],
      max_tokens: 1024
    });

    res.json({ leccion: response.choices[0].message.content });

  } catch (error) {
    console.error("Error generando lección:", error);
    res.status(500).json({ error: "Error generando la lección" });
  }
});

app.get("/generar_leccion", (req, res) => {
  res.send("Ruta generar_leccion funcionando. Usa método POST para generar la lección.");
});


// APIs USUARIOS 

app.post("/guardar_usuario", async (req, res) => {
  try {
    const { nombre, email, nivel_general } = req.body;

    const nuevoUsuario = await db.collection("users").add({
      nombre,
      email,
      nivel_general
    });

    res.status(200).json({
      mensaje: "Usuario guardado correctamente",
      id: nuevoUsuario.id
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API para obtener usuarios
app.get("/usuarios", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const usuarios = [];

    snapshot.forEach(doc => {
      usuarios.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(usuarios);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const leccionesRoutes = require("./routes/lecciones.routes");
app.use(leccionesRoutes);


// INICIAR SERVIDOR

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});