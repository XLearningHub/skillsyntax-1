const admin = require("firebase-admin");
const serviceAccount = require("./firebase-key.json");

// Inicializar solo una vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

console.log("Conectado a Firebase Firestore con éxito");

module.exports = db;