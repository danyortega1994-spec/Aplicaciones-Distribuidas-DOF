require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const { MongoClient } = require("mongodb");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =====================================================
// MONGODB
// =====================================================

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error("✗ MONGODB_URI no está configurada en .env");
    process.exit(1);
}

const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000
});

// =====================================================
// TELEGRAM
// =====================================================

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

let bot = null;

if (TELEGRAM_TOKEN) {
    bot = new TelegramBot(TELEGRAM_TOKEN, {
        polling: false
    });

    console.log("✓ Bot de Telegram listo");
} else {
    console.warn("⚠ TELEGRAM_BOT_TOKEN no configurado");
}

// =====================================================
// SHA256
// =====================================================

function hashPassword(password) {
    return crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");
}

// =====================================================
// CONEXIÓN A MONGODB
// =====================================================

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

// =====================================================
// LOGIN + GENERAR PIN
// =====================================================

app.post("/usuarios/valida-login", async (req, res) => {

    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.status(400).json({
            valido: 0,
            estado: 0,
            msg: "Usuario y contraseña son requeridos"
        });
    }

    try {
        const db = client.db("practica10");

        const usuariosCol = db.collection("usuarios");
        const pinesCol = db.collection("pines");

        const hash = hashPassword(password);

        const user = await usuariosCol.findOne({
            usuario: usuario,
            password: hash,
            deleted: false
        });

        if (!user) {
            return res.json({
                valido: 0,
                estado: 0,
                msg: "Usuario o contraseña incorrectos"
            });
        }

        // Generar PIN de 4 dígitos
        const pin =
            Math.floor(1000 + Math.random() * 9000).toString();

        const ahora = new Date();

        // Expira en 3 minutos
        const expira =
            new Date(ahora.getTime() + 3 * 60000);

        // Guardar PIN
        await pinesCol.insertOne({
            usuario: usuario,
            pin: pin,
            creado: ahora,
            expira: expira,
            verificado: false
        });

        // Enviar por Telegram
        if (bot && user.telegramChatId) {

            try {
                await bot.sendMessage(
                    user.telegramChatId,
                    "🔐 Tu código 2FA es: " +
                    pin +
                    "\n⏰ Expira en 3 minutos"
                );

                console.log(
                    "✓ PIN enviado a Telegram para:",
                    usuario
                );

            } catch (telegramError) {

                console.error(
                    "✗ Error Telegram:",
                    telegramError.message
                );

                console.log(
                    "PIN generado:",
                    pin
                );
            }

        } else {
            console.log("PIN generado:", pin);
        }

        return res.json({
            valido: 1,
            estado: 1,
            msg: "PIN enviado a Telegram",
            usuario: usuario,
            expira: expira
        });

    } catch (error) {

        console.error("Error login:", error);

        return res.status(500).json({
            valido: 0,
            estado: 0,
            msg: "Error interno del servidor"
        });
    }
});

// =====================================================
// VALIDAR PIN + GENERAR TOKEN DE SESIÓN
// =====================================================

app.post("/usuarios/validar-pin", async (req, res) => {

    const { usuario, pin } = req.body;

    if (!usuario || !pin) {
        return res.status(400).json({
            acceso: 0,
            msg: "Usuario y PIN son requeridos"
        });
    }

    try {
        const db = client.db("practica10");

        const pinesCol = db.collection("pines");
        const sesionesCol = db.collection("sesiones");

        // PIN más reciente
        const registro = await pinesCol.findOne(
            { usuario: usuario },
            {
                sort: {
                    creado: -1
                }
            }
        );

        if (!registro) {
            return res.json({
                acceso: 0,
                msg: "No hay PIN generado"
            });
        }

        // Evitar reutilizar PIN
        if (registro.verificado === true) {
            return res.json({
                acceso: 0,
                msg: "Este PIN ya fue utilizado"
            });
        }

        // Verificar expiración
        if (new Date() > registro.expira) {
            return res.json({
                acceso: 0,
                msg: "PIN expirado"
            });
        }

        // Verificar PIN
        if (registro.pin !== pin) {
            return res.json({
                acceso: 0,
                msg: "PIN incorrecto"
            });
        }

        // Marcar PIN como utilizado
        await pinesCol.updateOne(
            {
                _id: registro._id
            },
            {
                $set: {
                    verificado: true
                }
            }
        );

        // =================================================
        // TOKEN DE SESIÓN - NUEVO EN FASE 4
        // =================================================

        const sessionToken =
            crypto.randomBytes(32).toString("hex");

        const creado =
            new Date();

        // Sesión válida durante 30 minutos
        const expira =
            new Date(creado.getTime() + 30 * 60000);

        await sesionesCol.insertOne({
            usuario: usuario,
            token: sessionToken,
            creado: creado,
            expira: expira,
            activa: true
        });

        return res.json({
            acceso: 1,
            status: 1,
            resultado: 1,
            msg: "Autenticación 2FA exitosa",
            sessionToken: sessionToken,
            usuario: usuario,
            expira: expira
        });

    } catch (error) {

        console.error(
            "Error validar PIN:",
            error
        );

        return res.status(500).json({
            acceso: 0,
            msg: "Error interno del servidor"
        });
    }
});

// =====================================================
// INFORMACIÓN DEL USUARIO
// REQUIERE TOKEN
// =====================================================

app.get("/api/user-info/:usuario", async (req, res) => {

    const usuario = req.params.usuario;

    try {
        const authorization =
            req.headers.authorization;

        if (!authorization) {
            return res.status(401).json({
                status: 0,
                msg: "Token de sesión requerido"
            });
        }

        const partes =
            authorization.split(" ");

        if (
            partes.length !== 2 ||
            partes[0] !== "Bearer"
        ) {
            return res.status(401).json({
                status: 0,
                msg: "Formato del token incorrecto"
            });
        }

        const token =
            partes[1];

        const db =
            client.db("practica10");

        const sesionesCol =
            db.collection("sesiones");

        const usuariosCol =
            db.collection("usuarios");

        // Buscar sesión activa
        const sesion =
            await sesionesCol.findOne({
                usuario: usuario,
                token: token,
                activa: true
            });

        if (!sesion) {
            return res.status(401).json({
                status: 0,
                msg: "Sesión inválida"
            });
        }

        // Revisar expiración
        if (new Date() > sesion.expira) {

            await sesionesCol.updateOne(
                {
                    _id: sesion._id
                },
                {
                    $set: {
                        activa: false
                    }
                }
            );

            return res.status(401).json({
                status: 0,
                msg: "Sesión expirada"
            });
        }

        // Obtener información del usuario
        const user =
            await usuariosCol.findOne({
                usuario: usuario,
                deleted: false
            });

        if (!user) {
            return res.status(404).json({
                status: 0,
                msg: "Usuario no encontrado"
            });
        }

        return res.json({
            status: 1,
            usuario: user.usuario,
            nombre: user.name,
            creado: user.created
        });

    } catch (error) {

        console.error(
            "Error user-info:",
            error
        );

        return res.status(500).json({
            status: 0,
            msg: "Error interno del servidor"
        });
    }
});

// =====================================================
// CERRAR SESIÓN
// =====================================================

app.post("/api/logout", async (req, res) => {

    const { usuario, sessionToken } =
        req.body;

    if (!usuario || !sessionToken) {
        return res.status(400).json({
            status: 0,
            msg: "Usuario y token son requeridos"
        });
    }

    try {
        const db =
            client.db("practica10");

        const sesionesCol =
            db.collection("sesiones");

        const resultado =
            await sesionesCol.updateOne(
                {
                    usuario: usuario,
                    token: sessionToken,
                    activa: true
                },
                {
                    $set: {
                        activa: false
                    }
                }
            );

        if (resultado.matchedCount === 0) {
            return res.json({
                status: 0,
                msg: "No se encontró una sesión activa"
            });
        }

        return res.json({
            status: 1,
            msg: "Sesión cerrada correctamente"
        });

    } catch (error) {

        console.error(
            "Error logout:",
            error
        );

        return res.status(500).json({
            status: 0,
            msg: "Error interno del servidor"
        });
    }
});

// =====================================================
// SERVIDOR
// =====================================================

app.listen(PORT, () => {

    console.log(
        `🚀 Servidor en http://localhost:${PORT}`
    );

    console.log("");
    console.log("Endpoints:");
    console.log(
        "POST /usuarios/valida-login"
    );
    console.log(
        "POST /usuarios/validar-pin"
    );
    console.log(
        "GET  /api/user-info/:usuario"
    );
    console.log(
        "POST /api/logout"
    );
});
