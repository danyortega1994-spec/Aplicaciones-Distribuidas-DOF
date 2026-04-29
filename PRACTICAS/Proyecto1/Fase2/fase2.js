require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const express = require('express');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(express.json());

// TU URI
const uri = "mongodb+srv://danyortega1994_db_user:FHbCmjIYq7899CtP@cluster0.ytf0yn7.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri);

// HASH
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// CONEXIÓN
async function connectDB() {
    try {
        await client.connect();
        console.log("Conectado a MongoDB");
    } catch (error) {
        console.error("Error:", error);
    }
}

connectDB();


// LOGIN (FASE 2)
app.post('/usuarios/valida-login', async (req, res) => {

    const { usuario, password } = req.body;

    try {
        const db = client.db('practica10');
        const usuariosCol = db.collection('usuarios');

        const hash = hashPassword(password);

        const user = await usuariosCol.findOne({
            usuario: usuario,
            password: hash,
            deleted: false
        });

        if (user) {
            return res.json({
                valido: 1,
                estado: 1,
                mensaje: "Login correcto"
            });
        } else {
            return res.json({
                valido: 0,
                estado: 0,
                mensaje: "Usuario o contraseña incorrectos"
            });
        }

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error interno" });
    }
});


// SERVER
app.listen(PORT, () => {
    console.log(` Servidor activo en http://localhost:${PORT}`);
});
