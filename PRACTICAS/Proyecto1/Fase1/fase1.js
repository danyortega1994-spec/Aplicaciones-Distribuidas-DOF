require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const { MongoClient } = require('mongodb');
const crypto = require('crypto');

//  PON TU URI
const uri = "mongodb+srv://danyortega1994_db_user:FHbCmjIYq7899CtP@cluster0.ytf0yn7.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri);

//  HASH SHA256
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

//  5 USUARIOS
const rawUsers = [
    { usuario: 'daniel@mail.com', password: '123456', name: 'Daniel' },
    { usuario: 'ana@mail.com', password: '654321', name: 'Ana' },
    { usuario: 'luis@mail.com', password: 'abc123', name: 'Luis' },
    { usuario: 'maria@mail.com', password: 'pass789', name: 'Maria' },
    { usuario: 'carlos@mail.com', password: 'qwerty', name: 'Carlos' }
];

async function run() {
    try {
        await client.connect();

        const db = client.db('practica10'); // nombre que usarás después
        const usuariosCol = db.collection('usuarios');

        // LIMPIAR (opcional)
        await usuariosCol.deleteMany({});

        console.log(" Creando usuarios...");

        for (const user of rawUsers) {

            const nuevo = {
                usuario: user.usuario,
                password: hashPassword(user.password),
                name: user.name,
                deleted: false,
                created: new Date()
            };

            await usuariosCol.insertOne(nuevo);

            console.log(`Usuario '${user.usuario}' creado`);
        }

        console.log("\n Se insertaron 5 usuarios correctamente");

    } catch (err) {
        console.error(" Error:", err);
    } finally {
        await client.close();
    }
}

run();
