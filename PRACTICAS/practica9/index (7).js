// npm install express mongodb

const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();

// ⚠️ CAMBIA TU PASSWORD
const uri = "mongodb+srv://danyortega1994_db_user:FHbCmjIYq7899CtP@cluster0.ytf0yn7.mongodb.net/?appName=Cluster0";

// Variables globales
let client;
let database;
let collection;
let auditCollection;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 CONEXIÓN A MONGODB
async function connectDB() {
  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000
    });

    await client.connect();

    console.log("✅ Conectado a MongoDB");

    database = client.db("practica9");
    collection = database.collection("proyectos");
    auditCollection = database.collection("auditoria");

  } catch (error) {
    console.error("❌ Error conectando:", error.message);
  }
}

// 🔹 Endpoint raíz
app.get("/", (req, res) => {
  res.json({ message: "Servidor funcionando - Practica 9" });
});


// 🔥 CREATE (INSERTAR CON id_externo + deleted)
app.post("/proyectos", async (req, res) => {
  try {
    const data = req.body;

    const nuevo = {
      ...data,
      id_externo: Date.now(),
      deleted: false
    };

    const result = await collection.insertOne(nuevo);

    // AUDITORÍA
    await auditCollection.insertOne({
      accion: "CREATE",
      quien: "Daniel",
      desde: req.ip,
      cuando: new Date(),
      autorizado_por: "admin",
      descripcion: "Se insertó un nuevo proyecto"
    });

    res.json(result);

  } catch (error) {
    res.status(500).json(error);
  }
});


// 🔥 READ (SOLO ACTIVOS)
app.get("/proyectos", async (req, res) => {
  try {
    const data = await collection.find({ deleted: false }).toArray();
    res.json(data);
  } catch (error) {
    res.status(500).json(error);
  }
});


// 🔥 UPDATE (CAMBIAR NOMBRE)
app.put("/proyectos/:id", async (req, res) => {
  try {
    const result = await collection.updateOne(
      { id_externo: parseInt(req.params.id) },
      { $set: { nombre: req.body.nombre } }
    );

    // AUDITORÍA
    await auditCollection.insertOne({
      accion: "UPDATE",
      quien: "Daniel",
      desde: req.ip,
      cuando: new Date(),
      autorizado_por: "admin",
      descripcion: "Se actualizó el nombre del proyecto"
    });

    res.json(result);

  } catch (error) {
    res.status(500).json(error);
  }
});


// 🔥 DELETE FÍSICO
app.delete("/proyectos/:id", async (req, res) => {
  try {
    const result = await collection.deleteOne({
      id_externo: parseInt(req.params.id)
    });

    // AUDITORÍA
    await auditCollection.insertOne({
      accion: "DELETE FISICO",
      quien: "Daniel",
      desde: req.ip,
      cuando: new Date(),
      autorizado_por: "admin",
      descripcion: "Se eliminó físicamente un proyecto"
    });

    res.json(result);

  } catch (error) {
    res.status(500).json(error);
  }
});


// 🔥 DELETE LÓGICO
app.put("/proyectos/delete-logico/:id", async (req, res) => {
  try {
    const result = await collection.updateOne(
      { id_externo: parseInt(req.params.id) },
      { $set: { deleted: true } }
    );

    // AUDITORÍA
    await auditCollection.insertOne({
      accion: "DELETE LOGICO",
      quien: "Daniel",
      desde: req.ip,
      cuando: new Date(),
      autorizado_por: "admin",
      descripcion: "Se marcó como eliminado lógico"
    });

    res.json(result);

  } catch (error) {
    res.status(500).json(error);
  }
});


// 🔥 VER AUDITORÍA
app.get("/auditoria", async (req, res) => {
  try {
    const data = await auditCollection.find().toArray();
    res.json(data);
  } catch (error) {
    res.status(500).json(error);
  }
});


// 🚀 INICIAR SERVIDOR
app.listen(3000, async () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
  await connectDB();
});
