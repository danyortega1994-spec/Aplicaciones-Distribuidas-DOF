// npm install express mongodb

const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();

// ⚠️ CAMBIA TU PASSWORD AQUÍ
const uri = "mongodb+srv://danyortega1994_db_user:FHbCmjIYq7899CtP@cluster0.ytf0yn7.mongodb.net/?appName=Cluster0";

// Variables globales
let client;
let database;
let collection;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 CONEXIÓN SEGURA (NO SE CUELGA)
async function connectDB() {
  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000 // ⏱ máximo 5 segundos
    });

    await client.connect();

    console.log("✅ Conectado a MongoDB");

    // 🔥 PRÁCTICA 8
    database = client.db("practica8");
    collection = database.collection("proyectos");

  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error.message);
  }
}

// Endpoint raíz
app.get("/", (req, res) => {
  res.json({ message: "Servidor funcionando - Practica 8" });
});

// GET con parámetros
app.get("/serv001", (req, res) => {
  res.json({
    user_id: req.query.id,
    token: req.query.token,
    geo: req.query.geo,
  });
});

// POST con body
app.post("/serv002", (req, res) => {
  res.json({
    user_id: req.body.id,
    token: req.body.token,
    geo: req.body.geo,
  });
});

// Endpoint del profe
app.post("/serv003/:info", (req, res) => {
  res.json({
    info: req.params.info,
  });
});

// 🔥 INSERTAR PROYECTOS (YA NO SE CUELGA)
app.post("/receipt/insert", async (req, res) => {
  console.log("📩 Petición recibida");

  try {
    const proyectos = req.body;

    // Validación
    if (!Array.isArray(proyectos)) {
      return res.status(400).json({
        error: "El body debe ser un arreglo de objetos",
      });
    }

    // 🔥 SI NO HAY CONEXIÓN, RESPONDE
    if (!collection) {
      return res.status(500).json({
        error: "No hay conexión a MongoDB",
      });
    }

    const result = await collection.insertMany(proyectos);

    res.json({
      message: `${result.insertedCount} proyectos insertados correctamente`,
    });

  } catch (error) {
    console.error("❌ Error en endpoint:", error);

    res.status(500).json({
      error: "Error al insertar",
      details: error.message,
    });
  }
});

// Iniciar servidor
app.listen(3000, async () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");

  await connectDB();
});
