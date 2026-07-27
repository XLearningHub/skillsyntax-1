const express = require("express");
const cors = require("cors");
const db = require("./db");
const admin = require("firebase-admin");   // Para FieldValue.arrayUnion
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

//  MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.static(path.join(__dirname, "public")));

// SERVIR AUDIOS
app.use("/audio", express.static(path.join(__dirname, "public/audio")));

// RUTAS DE LA APP
const nivelesRoutes = require("./routes/niveles.routes");
const readingRoutes = require("./routes/reading.routes");
const listeningRoutes = require("./routes/listening.routes");
const speakingRoutes = require("./routes/speaking.routes");
const writingRoutes = require("./routes/writing.routes");
const sesionesRoutes = require("./routes/sesiones.routes");
const usuariosRoutes = require("./routes/usuarios.routes");
const loginRoutes = require("./routes/login.routes");
const resultadosRoutes = require("./routes/resultados.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const adminRoutes = require("./routes/admin.routes");
const gruposRoutes = require("./routes/grupos.routes");
const perfilRoutes = require("./routes/perfil.routes");


app.use("/api/niveles", nivelesRoutes);
app.use("/api/reading", readingRoutes);
app.use("/api/listening", listeningRoutes);
app.use("/api/speaking", speakingRoutes);
app.use("/api/writing", writingRoutes);
app.use("/api/sesiones", sesionesRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/resultados", resultadosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/grupos", gruposRoutes);
app.use("/api/perfil", perfilRoutes);

// REGISTRO DE USUARIO (Firestore) — DESACTIVADO
// Esta ruta "fantasma" escribía solo en Firestore y evadía Firebase Auth.
// El flujo correcto ahora está en: POST /api/usuarios (usuarios.controller.js)
/*
app.post("/guardar_usuario", async (req, res) => {
  // ... código antiguo comentado por seguridad
});
*/

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

// RUTAS HTML
/*app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/login.html"))
);

app.get("/test", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/test.html"))
);
*/
// SERVIDOR
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

app.use((err, req, res, next) => {
  console.error("ERROR GLOBAL:", err);
  res.status(500).json({ error: "Error interno" });
});

process.on("uncaughtException", (err) => {
  console.error("💥 ERROR NO CAPTURADO:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("💥 PROMESA NO MANEJADA:", err);
});