const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();

//  MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

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


app.use("/api/niveles", nivelesRoutes);
app.use("/api/reading", readingRoutes);
app.use("/api/listening", listeningRoutes);
app.use("/api/speaking", speakingRoutes);
app.use("/api/writing", writingRoutes);
app.use("/api/sesiones", sesionesRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/login", loginRoutes);
//app.use("/api/resultados", resultadosRoutes);
app.use("/api/resultados", resultadosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);

// REGISTRO DE USUARIO
app.post("/guardar_usuario", async (req, res) => {

  console.log("Datos recibidos:", req.body);

  const { nombre, email, password, nivel_general } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (nombre, email, password, nivel_general) VALUES (?, ?, ?, ?)",
      [nombre, email, hashedPassword, nivel_general],
      (err, result) => {

        if (err) {
          console.error("Error BD:", err);

          // Error: correo duplicado
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "El correo ya está registrado" });
          }

          return res.status(500).json({ error: "Error al guardar usuario" });
        }

        res.json({ mensaje: "Usuario guardado correctamente" });
      }
    );

  } catch (error) {
    console.error("Error servidor:", error);
    res.status(500).json({ error: "Error servidor" });
  }

});

// RUTAS HTML
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/login.html"))
);

app.get("/test", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/test.html"))
);

// SERVIDOR
app.listen(3000, () =>
  console.log("Servidor corriendo en http://localhost:3000")
);

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