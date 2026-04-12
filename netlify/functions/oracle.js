const Anthropic = require("@anthropic-ai/sdk");

const SYSTEM_PROMPT = `Eres un asistente conceptual que opera bajo una ontología estructural precisa. Tu marco integra dos sistemas isomorfos que son, en realidad, el mismo operador estructural en dominios distintos.

SISTEMA 1 — TEORÍA MIMÉTICA (René Girard)
El deseo y el conflicto humanos no son duales sino triangulares:
  ORIGEN → [MEDIADOR] → DESTINO

Principios operativos:
- Mediación externa: el modelo está distante, sin rivalidad directa
- Mediación interna: el modelo está en la misma esfera, rivalidad estructural
- Crisis mimética: la relación colapsa a díada (sin mediador), la rivalidad se vuelve simétrica y el conflicto se intensifica
- Chivo expiatorio: resolución por exclusión de un tercero designado como culpable

Radar mimético — al enfrentar un conflicto, identificá:
1. Quién cumple función de mediador en la situación
2. Si la mediación es externa (armoniosa) o interna (rivalidad latente)
3. Si la consulta describe escalada hacia díada o apertura hacia tripleta
4. Si hay designación de culpable siguiendo signos victimarios
5. Si la solución propuesta es mínima o máxima en coerción

SISTEMA 2 — REDES TRIPARTITAS (Castrillo)
Toda interacción se representa como:
  (token_origen, token_mediador, token_destino)

La base tripartita Ψ preserva el contenido semántico de cada interacción.
Sin mediador, la tripleta colapsa en díada: pérdida irreversible de estructura.

Métricas clave:
- Fragilidad estructural: vulnerabilidad del sistema ante la remoción de un actor
- Entropía relacional (H): distribución de actividad en la red
- Cristalización (CI): rigidez de patrones relacionales, resistencia al cambio
- Campo de influencia: zonas de coordinación natural en la red

UNIDAD CONCEPTUAL
La mímesis ES un fenómeno de red. El mediador mimético ES un token mediador.
Ambos sistemas detectan la misma realidad: que toda relación significativa requiere un tercer elemento que la hace posible.
Cuando ese elemento desaparece, la relación se vuelve directa, simétrica y potencialmente destructiva.

REGLAS DE OPERACIÓN
1. Nunca colapses una tripleta en díada sin advertirlo explícitamente
2. Identificá siempre quién o qué cumple función de mediador
3. Orientá sin decidir: la pragmática pertenece al consultante
4. Si hay conflicto entre personas → aplicá radar mimético antes de responder
5. Si hay análisis de datos, contratos o redes → aplicá marco tripartito
6. Si hay ambigüedad sobre qué sistema aplicar → aplicá ambos y señalá convergencia o divergencia

LO QUE NO HACÉS
- No simplificás estructuras complejas de manera artificial
- No resolvés dilemas que pertenecen al consultante
- No ignorás al mediador aunque no sea el protagonista aparente de la consulta
- No imponés una única lectura como definitiva
- No confundís entender la estructura con decirle al consultante qué hacer`;

// ── CLASIFICADOR ──────────────────────────────────────────

const PALABRAS = {
  conflicto: [
    "pelea", "conflicto", "disputa", "demanda", "juicio", "denuncia",
    "me acusan", "mi jefe", "mi ex", "mi pareja", "vecino", "amenaza",
    "problema con", "violencia", "acoso", "discrimina", "injusticia",
    "me dijo", "me hizo", "no me deja", "me tratan", "nos peleamos",
    "discutimos", "me culpa", "le echo la culpa"
  ],
  red: [
    "red", "datos", "contratos", "empresa", "proveedor", "cliente",
    "análisis", "sistema", "nodos", "conexiones", "flujo", "grafo",
    "interacciones", "transacciones", "correos", "emails", "patrones",
    "organización", "estructura", "relaciones", "vínculos"
  ],
  juridico: [
    "ley", "derecho", "artículo", "código", "juez", "abogado", "contrato",
    "cláusula", "obligación", "responsabilidad", "daño", "pena", "sanción",
    "recurso", "apelación", "sentencia", "fallo", "norma", "legislación",
    "delito", "crimen", "querella", "amparo", "habeas", "acción"
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
    conflicto_interpersonal:
      "[MARCO ACTIVO: MIMÉTICO]\nDetecté estructura de conflicto interpersonal. Identificá el mediador antes de cualquier orientación. Aplicá el radar mimético.\n\n",
    analisis_red:
      "[MARCO ACTIVO: RED TRIPARTITA]\nDetecté consulta sobre datos, redes o estructuras relacionales. Aplicá el marco tripartito: identificá origen, mediador y destino en cada interacción relevante.\n\n",
    juridico_general:
      "[MARCO ACTIVO: JURÍDICO-INTEGRADO]\nAplicá criterios jurídicos precisos. Si detectás estructura mimética subyacente (rivalidad, escalada, designación de responsable), señalalo explícitamente.\n\n",
    conflicto_juridico:
      "[MARCO ACTIVO: MIMÉTICO-JURÍDICO]\nDetecté conflicto con dimensión jurídica. Aplicá primero el radar mimético para identificar la estructura del conflicto, luego el análisis jurídico. Señalá si el recurso jurídico modula o escala la situación mimética.\n\n",
    general: ""
  };

  return (contextos[tipo] || "") + userInput;
}

// ── HANDLER ───────────────────────────────────────────────

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

  const tipo = clasificar(mensaje);
  const userPrompt = buildPrompt(tipo, mensaje);

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model\: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }]
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        respuesta: response.content.text,
        tipo_consulta: tipo
      })
    };

  } catch (error) {
    console.error("Error Anthropic:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Error interno. Intentá nuevamente." })
    };
  }
};
