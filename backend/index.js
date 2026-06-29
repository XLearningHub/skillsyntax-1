const express = require("express");
const cors = require("cors");
const db = require("./db");
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
const adminRoutes  = require("./routes/admin.routes");
const gruposRoutes = require("./routes/grupos.routes");


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
app.use("/api/admin",  adminRoutes);
app.use("/api/grupos", gruposRoutes);

// REGISTRO DE USUARIO (Firestore)
app.post("/guardar_usuario", async (req, res) => {

  console.log("[REGISTRO] Datos recibidos:", req.body);

  const { nombre, email, password, nivel_general } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    // Verificar si ya existe el correo
    const existing = await db.collection("users").where("email", "==", email).limit(1).get();

    if (!existing.empty) {
      const existingDoc = existing.docs[0];
      const existingData = existingDoc.data();

      // BUG-02 FIX: Si el documento existe pero está incompleto (huérfano de un
      // intento fallido anterior), lo eliminamos para permitir el reintento.
      // Un registro se considera "completo" únicamente si tiene campo `password`.
      if (!existingData.password) {
        console.warn("[REGISTRO] Documento huérfano detectado para:", email, "— eliminando y reintentando.");
        await db.collection("users").doc(existingDoc.id).delete();
      } else {
        // El registro anterior sí fue exitoso; bloqueamos el intento.
        return res.status(400).json({ error: "El correo ya está registrado" });
      }
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Guardar en Firestore
    const docRef = await db.collection("users").add({
      nombre,
      email,
      password: hashedPassword,
      nivel_general: nivel_general || null,
      rol: "alumno",
      createdAt: new Date().toISOString(),
    });

    console.log("[REGISTRO] Usuario creado con ID:", docRef.id);

    res.json({
      success: true,
      id: docRef.id,
      mensaje: "Usuario guardado correctamente"
    });

  } catch (error) {
    console.error("[REGISTRO] Error servidor:", error);
    res.status(500).json({ error: "Error servidor" });
  }

});

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