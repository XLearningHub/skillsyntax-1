const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config();

// Crear servidor Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos del frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Configuración de Firebase Admin
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Inicializar Firestore
const db = admin.firestore();

// Importar rutas de cada sección
const readingRoutes = require("./routes/reading.routes");
const listeningRoutes = require("./routes/listening.routes");
const speakingRoutes = require("./routes/speaking.routes");
const writingRoutes = require("./routes/writing.routes");

// Usar rutas de la API
app.use("/api", readingRoutes);
app.use("/api", listeningRoutes);
app.use("/api", speakingRoutes);
app.use("/api", writingRoutes);

// Ruta principal → Login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

// Ruta del test después del login
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/test.html"));
});

// Guardar nivel por sección
app.post("/api/guardar_nivel_seccion", async (req, res) => {
  try {
    const { email, seccion, nivel } = req.body;

    if (!email || !seccion || !nivel) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    await db.collection("niveles_secciones").add({
      email,
      seccion,
      nivel,
      fecha: new Date()
    });

    res.json({ mensaje: "Nivel guardado correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al guardar nivel" });
  }
});

// Guardar usuario en Firestore
app.post("/api/guardar_usuario", async (req, res) => {
  try {
    const { nombre, email, nivel_general } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const nuevoUsuario = await db.collection("users").add({
      nombre,
      email,
      nivel_general: nivel_general || "A1",
      fecha: new Date()
    });

    res.json({
      mensaje: "Usuario guardado correctamente",
      id: nuevoUsuario.id
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Levantar servidor
app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
