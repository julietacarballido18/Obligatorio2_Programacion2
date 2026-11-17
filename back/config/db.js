// =====================================================================
//  CLASE 9 · Paso 3 · LA CONEXIÓN A LA BASE
//  Programación 2 · Lic. en Diseño Multimedia · Universidad ORT Uruguay
//
//  Un archivo, un trabajo: éste solo sabe CONECTARSE a MongoDB.
//  Es la misma idea de la clase 8, una capa más.
//
//  Fijate que la dirección de la base NO está escrita acá: está en el
//  archivo .env, que no se sube a ningún lado. Acá solo la leemos con
//  process.env.MONGO_URI
// =====================================================================

import mongoose from "mongoose"

import dns from "dns"
dns.setServers(["8.8.8.8", "1.1.1.1"]) //para conectar el servidor compartiendome wifi desde el celular

export async function conectarBase() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Conectado a MongoDB Atlas")
    } catch (error) {
        console.log("NO se pudo conectar a la base:")
        console.log(error.message)
        process.exit(1)
    }
}
