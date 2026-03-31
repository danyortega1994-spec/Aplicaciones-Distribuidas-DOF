const { MongoClient } = require('mongodb');

async function listDatabases(client) {
  const databasesList = await client.db("admin").admin().listDatabases();

  console.log("Bases de datos disponibles:");
  databasesList.databases.forEach(db => console.log(` - ${db.name}`));
}

async function main() {
  const usuario = encodeURIComponent("danyortega1994_db_user");
  const password = encodeURIComponent("FHbCmjIYq7899CtP");

  const uri = `mongodb://${usuario}:${password}@ac-wxjgbqp-shard-00-00.ytf0yn7.mongodb.net:27017,ac-wxjgbqp-shard-00-01.ytf0yn7.mongodb.net:27017,ac-wxjgbqp-shard-00-02.ytf0yn7.mongodb.net:27017/?ssl=true&replicaSet=atlas-iorc4f-shard-0&authSource=admin&appName=Cluster0`;

  const client = new MongoClient(uri);

  try {
    console.log("Intentando conectar a MongoDB Atlas...");
    await client.connect();
    console.log("¡Conexión exitosa! 🚀");

    await listDatabases(client);

  } catch (e) {
    console.error("Error detectado:", e.message);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
