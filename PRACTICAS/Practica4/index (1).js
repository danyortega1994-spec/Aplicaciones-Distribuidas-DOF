//ALUMNO: Ortega Fuentes Daniel
//PRACTICA 4:
// ALUMNO: Ortega Fuentes Daniel
// PRACTICA 4 - API RESTFUL
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// VARIABLES EN MEMORIA
// ===============================
let tareas = [];

// ===============================
// RUTA RAÍZ
// ===============================
app.get("/", (req, res) => {
    res.json({
        estado: "exito",
        mensaje: "SERVIDOR FUNCIONANDO CORRECTAMENTE"
    });
});

// ===============================
// EJERCICIO 1 - SALUDO
// ===============================
app.post("/saludo", (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre || typeof nombre !== "string" || nombre.trim() === "") {
            throw new Error("El nombre es obligatorio");
        }

        res.json({
            estado: "exito",
            mensaje: `Hola, ${nombre}`
        });
    } catch (error) {
        res.status(400).json({ estado: "error", mensaje: error.message });
    }
});

// ===============================
// EJERCICIO 2 - CALCULADORA
// ===============================
app.post("/calcular", (req, res) => {
    try {
        const a = parseFloat(req.body.a);
        const b = parseFloat(req.body.b);
        const operacion = req.body.operacion;

        if (isNaN(a) || isNaN(b)) {
            throw new Error("a y b deben ser números");
        }

        let resultado;

        switch (operacion) {
            case "suma":
                resultado = a + b;
                break;
            case "resta":
                resultado = a - b;
                break;
            case "multiplicacion":
                resultado = a * b;
                break;
            case "division":
                if (b === 0) throw new Error("No se puede dividir entre cero");
                resultado = a / b;
                break;
            default:
                throw new Error("Operación no válida");
        }

        res.json({
            estado: "exito",
            resultado
        });
    } catch (error) {
        res.status(400).json({ estado: "error", mensaje: error.message });
    }
});

// ===============================
// EJERCICIO 3 - CRUD TAREAS
// ===============================
app.post("/tareas", (req, res) => {
    try {
        const { id, titulo, completada } = req.body;

        if (!id || !titulo) {
            throw new Error("id y titulo son obligatorios");
        }

        if (tareas.find(t => t.id === id)) {
            throw new Error("El ID ya existe");
        }

        const tarea = {
            id,
            titulo,
            completada: Boolean(completada)
        };

        tareas.push(tarea);

        res.json({ estado: "exito", tarea });
    } catch (error) {
        res.status(400).json({ estado: "error", mensaje: error.message });
    }
});

app.get("/tareas", (req, res) => {
    res.json({
        estado: "exito",
        total: tareas.length,
        tareas
    });
});

app.put("/tareas/:id", (req, res) => {
    try {
        const id = req.params.id;
        const tarea = tareas.find(t => t.id == id);

        if (!tarea) throw new Error("Tarea no encontrada");

        if (req.body.titulo !== undefined) tarea.titulo = req.body.titulo;
        if (req.body.completada !== undefined) tarea.completada = req.body.completada;

        res.json({ estado: "exito", tarea });
    } catch (error) {
        res.status(404).json({ estado: "error", mensaje: error.message });
    }
});

app.delete("/tareas/:id", (req, res) => {
    try {
        const id = req.params.id;
        const index = tareas.findIndex(t => t.id == id);

        if (index === -1) throw new Error("Tarea no encontrada");

        const eliminada = tareas.splice(index, 1);

        res.json({ estado: "exito", tarea: eliminada[0] });
    } catch (error) {
        res.status(404).json({ estado: "error", mensaje: error.message });
    }
});

// ===============================
// EJERCICIO 4 - VALIDAR PASSWORD
// ===============================
app.post("/validar-password", (req, res) => {
    const password = req.body.password || "";
    let errores = [];

    if (password.length < 8) errores.push("Mínimo 8 caracteres");
    if (!/[A-Z]/.test(password)) errores.push("Debe tener mayúscula");
    if (!/[a-z]/.test(password)) errores.push("Debe tener minúscula");
    if (!/[0-9]/.test(password)) errores.push("Debe tener número");

    res.json({
        estado: "exito",
        esValida: errores.length === 0,
        errores
    });
});

// ===============================
// EJERCICIO 5 - CONVERTIR TEMPERATURA
// ===============================
app.post("/convertir-temperatura", (req, res) => {
    try {
        const valor = parseFloat(req.body.valor);
        const desde = req.body.desde;
        const hacia = req.body.hacia;

        if (isNaN(valor)) throw new Error("Valor inválido");

        let celsius;

        if (desde === "C") celsius = valor;
        else if (desde === "F") celsius = (valor - 32) * 5 / 9;
        else if (desde === "K") celsius = valor - 273.15;
        else throw new Error("Escala inválida");

        let resultado;
        if (hacia === "C") resultado = celsius;
        else if (hacia === "F") resultado = (celsius * 9 / 5) + 32;
        else if (hacia === "K") resultado = celsius + 273.15;
        else throw new Error("Escala inválida");

        res.json({
            estado: "exito",
            valorOriginal: valor,
            valorConvertido: Math.round(resultado * 100) / 100,
            escalaOriginal: desde,
            escalaConvertida: hacia
        });
    } catch (error) {
        res.status(400).json({ estado: "error", mensaje: error.message });
    }
});

// ===============================
// EJERCICIO 6 - BUSCADOR EN ARRAY (CORREGIDO)
// ===============================
app.post("/buscar", (req, res) => {
    try {
        const { array, elemento } = req.body;

        if (!Array.isArray(array)) {
            throw new Error("array debe ser un arreglo");
        }

        const indice = array.indexOf(elemento);

        res.json({
            estado: "exito",
            encontrado: indice !== -1,
            indice: indice,
            tipoElemento: typeof elemento
        });
    } catch (error) {
        res.status(400).json({ estado: "error", mensaje: error.message });
    }
});

// ===============================
// EJERCICIO 7 - CONTADOR DE PALABRAS (CORREGIDO)
// ===============================
app.post("/contar-palabras", (req, res) => {
    try {
        const { texto } = req.body;

        if (typeof texto !== "string") {
            throw new Error("texto debe ser string");
        }

        const caracteres = texto.length;

        const palabras = texto
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(p => p !== "");

        const palabrasUnicas = new Set(palabras);

        res.json({
            estado: "exito",
            totalPalabras: palabras.length,
            totalCaracteres: caracteres,
            palabrasUnicas: palabrasUnicas.size
        });
    } catch (error) {
        res.status(400).json({ estado: "error", mensaje: error.message });
    }
});

// ===============================
// SERVIDOR
// ===============================
app.listen(3000, () => {
    console.log("Servidor iniciado en puerto 3000");
});
