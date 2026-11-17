// TRAE DATOS O IMAGENES DEL MUSEO (hace el pedido desde el servidor, no desde el navegador)
export async function traerDelMuseo(url) {
    const respuesta = await fetch(url, { /* le hace pedido al museo */
        headers: { "AIC-User-Agent": "museo-personal (ORT Programacion 2)" } /* con lo que el museo pide que nos identifiquemos */
    })
    const cuerpo = Buffer.from(await respuesta.arrayBuffer()) /* lee la respuesta en crudo porque llegar JSON o JPG */
    return {
        status: respuesta.status,
        tipo: respuesta.headers.get("content-type") || "application/octet-stream",
        cuerpo: cuerpo
    }
} /* Este no decide nada, solo busca y devuelve lo que trae */