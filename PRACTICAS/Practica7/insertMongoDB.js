// npm install express mongodb

const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();

// ⚠️ PON AQUÍ TU URI REAL (SIN < >)
const uri = "mongodb+srv://danyortega1994_db_user:FHbCmjIYq7899CtP@cluster0.ytf0yn7.mongodb.net/?appName=Cluster0";

// Variables globales
let client;
let database;
let collection;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a MongoDB
async function connectDB() {
  try {
    client = new MongoClient(uri);
    await client.connect();

    console.log("✅ Conectado a MongoDB");

    database = client.db("myDatabase");
    collection = database.collection("recipes");

  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error);
    process.exit(1);
  }
}

// Endpoint raíz
app.get("/", (req, res) => {
  res.json({ message: "Servidor funcionando correctamente" });
});

// GET con query params
app.get("/serv001", (req, res) => {
  res.json({
    user_id: req.query.id,
    token: req.query.token,
    geo: req.query.geo,
  });
});

// Otro GET
app.get("/serv0010", (req, res) => {
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

// POST con parámetro en URL
app.post("/serv003/:info", (req, res) => {
  res.json({
    info: req.params.info,
  });
});

// ✅ ENDPOINT PRINCIPAL CORREGIDO
app.post("/receipt/insert", async (req, res) => {
  try {
    const recipes = req.body;

    // Validación
    if (!Array.isArray(recipes)) {
      return res.status(400).json({
        error: "El body debe ser un arreglo de objetos",
      });
    }

    const result = await collection.insertMany(recipes);

    res.json({
      message: `${result.insertedCount} documentos insertados correctamente`,
    });

  } catch (error) {
    console.error("❌ Error:", error);

    res.status(500).json({
      error: "Error al insertar datos",
      details: error.message,
    });
  }
});

// Iniciar servidor
app.listen(3000, async () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");

  await connectDB();
});
