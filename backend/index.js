const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a Firebase
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Backend SkillSyntax AI funcionando correctamente");
});

// API para probar conexión con OpenAI para las lecciones

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

// API para guardar usuario
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

// Iniciar servidor
app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});

