//ALUMNO: Ortega Fuentes Daniel
var express = require('express');
var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async function (request, response) {
    response.json({'message':'Nothing to send'});
});

//PRACTICA 1, GENERAR UN NUMERO ALEATORIO:
app.get('/aleatorio', async function (request, response) {
    const numero = Math.floor(Math.random() * 100) + 1;
    response.json({ "numero": numero });
});

app.listen(3000, function() {
    console.log('Aplicación ejemplo, escuchando el puerto 3000!');
});
