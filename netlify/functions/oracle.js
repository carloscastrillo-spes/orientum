Está funcionando. Ahora pegamos el código completo con los prompts y el llamado a Anthropic.
Abrí oracle.js en GitHub y reemplazá TODO con esto. Solo lo que está dentro del bloque de código, nada más:
const https = require("https");

const SYSTEM_PROMPT = `Eres un asistente conceptual que opera bajo una ontología estructural precisa. Tu marco integra dos sistemas isomorfos que son el mismo operador estructural en dominios distintos.

SISTEMA 1 — TEORÍA MIMÉTICA (René Girard)
El deseo y el conflicto humanos no son duales sino triangulares:
  ORIGEN → [MEDIADOR] → DESTINO

Principios operativos:
- Mediación externa: el modelo está distante, sin rivalidad directa
- Mediación interna: el modelo está en la misma esfera, rivalidad estructural
- Crisis mimética: la relación colapsa a díada sin mediador, rivalidad simétrica
- Chivo expiatorio: resolución por exclusión de un tercero designado como culpable

Radar mimético — al enfrentar un conflicto, identificá:
1. Quién cumple función de mediador en la situación
2. Si la mediación es externa o interna
3. Si la consulta describe escalada hacia díada o apertura hacia tripleta
4. Si hay designación de culpable siguiendo signos victimarios
5. Si la solución propuesta es mínima o máxima en coerción

SISTEMA 2 — REDES TRIPARTITAS (Castrillo)
Toda interacción se representa como:
  (token_origen, token_mediador, token_destino)

La base tripartita Ψ preserva el contenido semántico de cada interacción.
Sin mediador, la tripleta colapsa en díada: pérdida irreversible de estructura.

Métricas clave:
- Fragilidad estructural: vulnerabilidad ante remoción de un actor
- Entropía relacional H: distribución de actividad en la red
- Cristalización CI: rigidez de patrones relacionales
- Campo de influencia: zonas de coordinación natural

UNIDAD CONCEPTUAL
La mímesis ES un fenómeno de red. El mediador mimético ES un token mediador.
Toda relación significativa requiere un tercer elemento que la hace posible.
Cuando ese elemento desaparece, la relación se vuelve directa, simétrica y potencialmente destructiva.
El mediador es el equivalente funcional al elemento de Gödel: siempre existe algo transcendente al sistema formal que lo sostiene sin poder ser generado desde adentro.

REGLAS DE OPERACIÓN
1. Nunca colapses una tripleta en díada sin advertirlo explícitamente
2. Identificá siempre quién o qué cumple función de mediador
3. Orientá sin decidir: la pragmática pertenece al consultante
4. Si hay conflicto entre personas → aplicá radar mimético antes de responder
5. Si hay análisis de datos, contratos o redes → aplicá marco tripartito
6. Si hay ambigüedad → aplicá ambos y señalá convergencia o divergencia

LO QUE NO HACÉS
- No simplificás estructuras complejas artificialmente
- No resolvés dilemas que pertenecen al consultante
- No ignorás al mediador aunque no sea el protagonista aparente
- No imponés una única lectura como definitiva`;

const PALABRAS = {
  conflicto: [
    "pelea","conflicto","disputa","demanda","juicio","denuncia",
    "me acusan","mi jefe","mi ex","mi pareja","vecino","amenaza",
    "problema con","violencia","acoso","discrimina","injusticia",
    "me dijo","me hizo","no me deja","me tratan","nos peleamos",
    "discutimos","me culpa","le echo la culpa"
  ],
  red: [
    "red","datos","contratos","empresa","proveedor","cliente",
    "análisis","sistema","nodos","conexiones","flujo","grafo",
    "interacciones","transacciones","correos","emails","patrones",
    "organización","estructura","relaciones","vínculos"
  ],
  juridico: [
    "ley","derecho","artículo","código","juez","abogado","contrato",
    "cláusula","obligación","responsabilidad","daño","pena","sanción",
    "recurso","apelación","sentencia","fallo","norma","legislación",
    "delito","crimen","querella","amparo","habeas","acción"
  ]
};

function clasificar(texto) {
  const t = texto.toLowerCase();
  const s = {
    conflicto: PALABRAS.conflicto.filter(w => t.includes(w)).length,
    red: PALABRAS.red.filter(w => t.includes(w)).length,
    juridico: PALABRAS.juridico.filter(w => t.includes(w)).length
  };
  if (s.conflicto === 0 && s.red === 0 && s.juridico === 0) return "general";
  if (s.conflicto > 0 && s.juridico > 0) return "conflicto_juridico";
  const max = Math.max(s.conflicto, s.red, s.juridico);
  if (max === s.conflicto) return "conflicto_interpersonal";
  if (max === s.red) return "analisis_red";
  return "juridico_general";
}

function buildPrompt(tipo, userInput) {
  const contextos = {
    conflicto_interpersonal: "[MARCO ACTIVO: MIMÉTICO]\nDetecté estructura de conflicto interpersonal. Identificá el mediador antes de cualquier orientación. Aplicá el radar mimético.\n\n",
    analisis_red: "[MARCO ACTIVO: RED TRIPARTITA]\nDetecté consulta sobre datos, redes o estructuras relacionales. Aplicá el marco tripartito.\n\n",
    juridico_general: "[MARCO ACTIVO: JURÍDICO-INTEGRADO]\nAplicá criterios jurídicos precisos. Si detectás estructura mimética subyacente, señalalo.\n\n",
    conflicto_juridico: "[MARCO ACTIVO: MIMÉTICO-JURÍDICO]\nDetecté conflicto con dimensión jurídica. Aplicá primero el radar mimético, luego el análisis jurídico.\n\n",
    general: ""
  };
  return (contextos[tipo] || "") + userInput;
}

function llamarAnthropic(userPrompt, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }]
    });

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Respuesta inválida de Anthropic"));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Método no permitido." }) };
  }

  let mensaje;
  try {
    const body = JSON.parse(event.body);
    mensaje = body.mensaje?.trim();
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "JSON inválido." }) };
  }

  if (!mensaje || mensaje.length < 3) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Consulta vacía." }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "API key no configurada." }) };
  }

  const tipo = clasificar(mensaje);
  const userPrompt = buildPrompt(tipo, mensaje);

  try {
    const resultado = await llamarAnthropic(userPrompt, apiKey);

    if (resultado.error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: resultado.error.message || "Error de Anthropic." })
      };
    }

    const respuesta = resultado.content?.?.text;
    if (!respuesta) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Respuesta vacía." }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ respuesta, tipo_consulta: tipo })
    };

  } catch (error) {
    return {
      statusCode\: 200,
      headers,
      body\: JSON.stringify({ respuesta\: "ERROR CATCH\: " + error.message })
    };
  }
};

Guardá, esperá el deploy y probá con la consulta que quieras.
