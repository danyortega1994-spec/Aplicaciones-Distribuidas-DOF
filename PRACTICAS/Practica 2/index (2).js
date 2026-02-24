// ALUMNO: Ortega Fuentes Daniel
// Práctica2: Repaso API RESTful

const express = require('express');
const app = express();

// Middlewares para leer JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Endpoint raíz (prueba)

app.get("/", (req, res) => {
    res.status(200).json({
        estado: true,
        mensaje: "API REST funcionando correctamente"
    });
});


// Endpoint POST /echo

app.post("/echo", (req, res) => {

    const { id, lat, long } = req.body;

    // Validación de campos obligatorios
    if (!id || !lat || !long) {
        return res.status(400).json({
            estado: false,
            mensaje: "Faltan campos obligatorios: id, lat, long"
        });
    }

    // Convertir a string por seguridad
    const clat = lat.toString();
    const clong = long.toString();

    // Validar formato decimal
    if (!clat.includes('.') || !clong.includes('.')) {
        return res.status(400).json({
            estado: false,
            mensaje: "Latitud y longitud deben contener parte decimal"
        });
    }

    // Fragmentación
    const lat_parts = clat.split('.');
    const long_parts = clong.split('.');

    //Validar fragmentación correcta
    if (lat_parts.length !== 2 || long_parts.length !== 2) {
        return res.status(400).json({
            estado: false,
            mensaje: "Formato incorrecto en latitud o longitud"
        });
    }

    // Respuesta correcta
    res.status(200).json({
        estado: true,
        id_e: id,
        lat_e: clat,
        long_e: clong,
        lat_i_e: lat_parts[0],
        lat_d_e: lat_parts[1],
        long_i_e: long_parts[0],
        long_d_e: long_parts[1]
    });
});


// Endpoint no encontrado

app.use((req, res) => {
    res.status(404).json({
        estado: false,
        mensaje: "Endpoint no encontrado"
    });
});


// Arranque del servidor

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
