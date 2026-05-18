
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const express = require('express');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ======================================
// MONGODB
// ======================================

const uri =
    process.env.MONGODB_URI ||
    "mongodb+srv://danyortega1994_db_user:FHbCmjIYq7899CtP@cluster0.ytf0yn7.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000
});

// ======================================
// TELEGRAM BOT
// ======================================

const TELEGRAM_TOKEN =
    process.env.TELEGRAM_BOT_TOKEN ||
    "8765182578:AAEeXJSapIQ93C0TLRiGqCmW2Vs8HWHS2fc";

let bot = null;

if (TELEGRAM_TOKEN) {

    bot = new TelegramBot(TELEGRAM_TOKEN, {
        polling: false
    });

    console.log("✓ Bot de Telegram listo");
    console.log("TOKEN:", TELEGRAM_TOKEN);

} else {

    console.warn("✗ Telegram no configurado");
}

// ======================================
// HASH SHA256
// ======================================

function hashPassword(password) {

    return crypto
        .createHash('sha256')
        .update(password)
        .digest('hex');
}

// ======================================
// CONEXIÓN DB
// ======================================

async function connectDB() {

    try {

        await client.connect();

        console.log("✓ Conectado a MongoDB");

    } catch (error) {

        console.error("✗ Error MongoDB:", error.message);

        process.exit(1);
    }
}

connectDB();

// ======================================
// LOGIN + GENERAR PIN
// ======================================

app.post('/usuarios/valida-login', async (req, res) => {

    const { usuario, password } = req.body;

    if (!usuario || !password) {

        return res.status(400).json({
            valido: 0,
            msg: "Faltan datos"
        });
    }

    try {

        const db = client.db('practica10');

        const usuariosCol = db.collection('usuarios');

        const pinesCol = db.collection('pines');

        const hash = hashPassword(password);

        // VALIDAR LOGIN
        const user = await usuariosCol.findOne({

            usuario,
            password: hash,
            deleted: false
        });

        if (!user) {

            return res.json({

                valido: 0,
                estado: 0,
                msg: "Login incorrecto"
            });
        }

        // ======================================
        // GENERAR PIN
        // ======================================

        const pin =
            Math.floor(1000 + Math.random() * 9000).toString();

        const ahora = new Date();

        const expira =
            new Date(ahora.getTime() + 3 * 60000);

        // GUARDAR PIN
        await pinesCol.insertOne({

            usuario,
            pin,
            creado: ahora,
            expira,
            verificado: false
        });

        // ======================================
        // ENVIAR TELEGRAM
        // ======================================

        if (bot && user.telegramChatId) {

            try {

                await bot.sendMessage(

                    user.telegramChatId,

                    `🔐 Tu código 2FA es: ${pin}\n⏰ Expira en 3 minutos`
                );

                console.log(`✓ PIN enviado a ${usuario}`);
                console.log("PIN:", pin);

            } catch (telegramError) {

                console.error(
                    "✗ Error Telegram:",
                    telegramError.message
                );

                console.log("PIN LOCAL:", pin);
            }

        } else {

            console.log("⚠ No hay Telegram configurado");
            console.log("PIN:", pin);
        }

        // RESPUESTA
        res.json({

            valido: 1,
            estado: 1,
            msg: "PIN enviado a Telegram",
            usuario
        });

    } catch (err) {

        console.error("✗ Error login:", err);

        res.status(500).json({

            error: "Error interno"
        });
    }
});

// ======================================
// VALIDAR PIN
// ======================================

app.post('/usuarios/validar-pin', async (req, res) => {

    const { usuario, pin } = req.body;

    if (!usuario || !pin) {

        return res.status(400).json({

            acceso: 0,
            msg: "Faltan datos"
        });
    }

    try {

        const db = client.db('practica10');

        const pinesCol = db.collection('pines');

        // BUSCAR PIN MÁS RECIENTE
        const registro = await pinesCol.findOne(

            { usuario },

            { sort: { creado: -1 } }
        );

        if (!registro) {

            return res.json({

                acceso: 0,
                msg: "No hay PIN generado"
            });
        }

        // VALIDAR EXPIRACIÓN
        if (new Date() > registro.expira) {

            return res.json({

                acceso: 0,
                msg: "PIN expirado"
            });
        }

        // VALIDAR PIN
        if (registro.pin !== pin) {

            return res.json({

                acceso: 0,
                msg: "PIN incorrecto"
            });
        }

        // MARCAR COMO VERIFICADO
        await pinesCol.updateOne(

            { _id: registro._id },

            {
                $set: {
                    verificado: true
                }
            }
        );

        // RESPUESTA EXITOSA
        res.json({

            acceso: 1,
            msg: "Acceso concedido"
        });

    } catch (err) {

        console.error("✗ Error validar PIN:", err);

        res.status(500).json({

            error: "Error interno"
        });
    }
});

// ======================================
// SERVER
// ======================================

app.listen(PORT, () => {

    console.log(`🚀 Servidor en http://localhost:${PORT}`);
});


