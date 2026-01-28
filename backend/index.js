const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config();

// Iniciar Express
const app = express();
app.use(cors());
app.use(express.json());

// Conexión Firebase
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Rutas de secciones
const readingRoutes = require("./routes/reading.routes");
const listeningRoutes = require("./routes/listening.routes");
const speakingRoutes = require("./routes/speaking.routes");
const writingRoutes = require("./routes/writing.routes");

app.use("/api", readingRoutes);
app.use("/api", listeningRoutes);
app.use("/api", speakingRoutes);
app.use("/api", writingRoutes);

// Ruta principal
app.get("/", (req, res) => {
  res.send("Backend SkillSyntax AI funcionando correctamente");
});

// Test frontend
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/test.html"));
});

// Guardar nivel por sección
app.post("/guardar_nivel_seccion", async (req, res) => {
  try {
    const { email, seccion, nivel } = req.body;

    await db.collection("niveles_secciones").add({
      email,
      seccion,
      nivel
    });

    res.json({ mensaje: "Nivel guardado correctamente" });

  } catch (error) {
    res.status(500).json({ error: "Error al guardar nivel" });
  }
});

//  Guardar usuario
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

// Iniciar servidor
app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
