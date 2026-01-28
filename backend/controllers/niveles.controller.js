const admin = require("firebase-admin");
const db = admin.firestore();

exports.guardarNiveles = async (req, res) => {
  try {
    const { userId, reading, listening, speaking, writing } = req.body;

    await db.collection("users").doc(userId).set({
      niveles: {
        reading,
        listening,
        speaking,
        writing
      }
    }, { merge: true });

    res.json({ mensaje: "Niveles guardados correctamente" });

  } catch (error) {
    res.status(500).json({ error: "Error guardando niveles" });
  }
};
