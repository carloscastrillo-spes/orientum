const Anthropic = require("@anthropic-ai/sdk");

const SYSTEM_PROMPT = `Eres un asistente conceptual que opera bajo una ontología estructural precisa. Tu marco integra dos sistemas isomorfos que son, en realidad, el mismo operador estructural en dominios distintos.

SISTEMA 1 — TEORÍA MIMÉTICA (René Girard)
El deseo y el conflicto humanos no son duales sino triangulares\:
  ORIGEN → [MEDIADOR] → DESTINO

Principios operativos\:
- Mediación externa\: el modelo está distante, sin rivalidad directa
- Mediación interna\: el modelo está en la misma esfera, rivalidad estructural
- Crisis mimética\: la relación colapsa a díada (sin mediador), la rivalidad se vuelve simétrica y el conflicto se intensifica
- Chivo expiatorio\: resolución por exclusión de un tercero designado como culpable

Radar mimético — al enfrentar un conflicto, identificá\:
1. Quién cumple función de mediador en la situación
2. Si la mediación es externa (armoniosa) o interna (rivalidad latente)
3. Si la consulta describe escalada hacia díada o apertura hacia tripleta
4. Si hay designación de culpable siguiendo signos victimarios
5. Si la solución propuesta es mínima o máxima en coerción

SISTEMA 2 — REDES TRIPARTITAS (Castrillo)
Toda interacción se representa como\:
  (token_origen, token_mediador, token_destino)

La base tripartita Ψ preserva el contenido semántico de cada interacción.
Sin mediador, la tripleta colapsa en díada\: pérdida irreversible de estructura.

Métricas clave\:
- Fragilidad estructural\: vulnerabilidad del sistema ante la remoción de un actor
- Entropía relacional (H)\: distribución de actividad en la red
- Cristalización (CI)\: rigidez de patrones relacionales, resistencia al cambio
- Campo de influencia\: zonas de coordinación natural en la red

UNIDAD CONCEPTUAL
La mímesis ES un fenómeno de red. El mediador mimético ES un token mediador.
Ambos sistemas detectan la misma realidad\: que toda relación significativa requiere un tercer elemento que la hace posible.
Cuando ese elemento desaparece, la relación se vuelve directa, simétrica y potencialmente destructiva.

REGLAS DE OPERACIÓN
1. Nunca colapses una tripleta en díada sin advertirlo explícitamente
2. Identificá siempre quién o qué cumple función de mediador
3. Orientá sin decidir\: la pragmática pertenece al consultante
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
  conflicto\: [
    "pelea", "conflicto", "disputa", "demanda", "juicio", "denuncia",
    "me acusan", "mi jefe", "mi ex", "mi pareja", "vecino", "amenaza",
    "problema con", "violencia", "acoso", "discrimina", "injusticia",
    "me dijo", "me hizo", "no me deja", "me tratan", "nos peleamos",
    "discutimos", "me culpa", "le echo la culpa"
  ],
  red\: [
    "red", "datos", "contratos", "empresa", "proveedor", "cliente",
    "análisis", "sistema", "nodos", "conexiones", "flujo", "grafo",
    "interacciones", "transacciones", "correos", "emails", "patrones",
    "organización", "estructura", "relaciones", "vínculos"
  ],
  juridico\: [
    "ley", "derecho", "artículo", "código", "juez", "abogado", "contrato",
    "cláusula", "obligación", "responsabilidad", "daño", "pena", "sanción",
    "recurso", "apelación", "sentencia", "fallo", "norma", "legislación",
    "delito", "crimen", "querella", "amparo", "habeas", "acción"
  ]
};

function clasificar(texto) {
  const t = texto.toLowerCase();
  const s = {
    conflicto\: PALABRAS.conflicto.filter(w => t.includes(w)).length,
    red\: PALABRAS.red.filter(w => t.includes(w)).length,
    juridico\: PALABRAS.juridico.filter(w => t.includes(w)).length
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
    conflicto_interpersonal\:
      "[MARCO ACTIVO\: MIMÉTICO]\nDetecté estructura de conflicto interpersonal. Identificá el mediador antes de cualquier orientación. Aplicá el radar mimético.\n\n",
    analisis_red\:
      "[MARCO ACTIVO\: RED TRIPARTITA]\nDetecté consulta sobre datos, redes o estructuras relacionales. Aplicá el marco tripartito\: identificá origen, mediador y destino en cada interacción relevante.\n\n",
    juridico_general\:
      "[MARCO ACTIVO\: JURÍDICO-INTEGRADO]\nAplicá criterios jurídicos precisos. Si detectás estructura mimética subyacente (rivalidad, escalada, designación de responsable), señalalo explícitamente.\n\n",
    conflicto_juridico\:
      "[MARCO ACTIVO\: MIMÉTICO-JURÍDICO]\nDetecté conflicto con dimensión jurídica. Aplicá primero el radar mimético para identificar la estructura del conflicto, luego el análisis jurídico. Señalá si el recurso jurídico modula o escala la situación mimética.\n\n",
    general\: ""
  };

  return (contextos[tipo] || "") + userInput;
}

// ── HANDLER ───────────────────────────────────────────────

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin"\: "*",
    "Access-Control-Allow-Headers"\: "Content-Type",
    "Access-Control-Allow-Methods"\: "POST, OPTIONS",
    "Content-Type"\: "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode\: 200, headers, body\: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode\: 405, headers, body\: JSON.stringify({ error\: "Método no permitido." }) };
  }

  let mensaje;
  try {
    const body = JSON.parse(event.body);
    mensaje = body.mensaje?.trim();
  } catch {
    return { statusCode\: 400, headers, body\: JSON.stringify({ error\: "JSON inválido." }) };
  }

  if (!mensaje || mensaje.length < 3) {
    return { statusCode\: 400, headers, body\: JSON.stringify({ error\: "Consulta vacía." }) };
  }

  const tipo = clasificar(mensaje);
  const userPrompt = buildPrompt(tipo, mensaje);

  try {
    const client = new Anthropic({ apiKey\: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model\: "claude-opus-4-5",
      max_tokens\: 1024,
      system\: SYSTEM_PROMPT,
      messages\: [{ role\: "user", content\: userPrompt }]
    });

    return {
      statusCode\: 200,
      headers,
      body\: JSON.stringify({
        respuesta\: response.content.text,
        tipo_consulta\: tipo
      })
    };

  } catch (error) {
    console.error("Error Anthropic\:", error);
    return {
      statusCode\: 500,
      headers,
      body\: JSON.stringify({ error\: "Error interno. Intentá nuevamente." })
    };
  }
};


index.html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Orientum</title>
  <style>
    *, *\:\:before, *\:\:after { box-sizing\: border-box; margin\: 0; padding\: 0; }

    body {
      font-family\: 'Georgia', serif;
      background\: #f0ede8;
      min-height\: 100vh;
      display\: flex;
      justify-content\: center;
      align-items\: center;
      padding\: 16px;
    }.contenedor {
      background\: #fff;
      border-radius\: 10px;
      box-shadow\: 0 4px 24px rgba(0,0,0,0.08);
      width\: 100%;
      max-width\: 740px;
      height\: 88vh;
      display\: flex;
      flex-direction\: column;
      overflow\: hidden;
    }.cabecera {
      padding\: 18px 24px;
      border-bottom\: 1px solid #e8e4df;
      display\: flex;
      align-items\: baseline;
      gap\: 10px;
    }.cabecera h1 {
      font-size\: 1.15rem;
      color\: #1a1a1a;
      font-weight\: bold;
      letter-spacing\: 0.02em;
    }.cabecera span {
      font-size\: 0.8rem;
      color\: #999;
      font-style\: italic;
    }.chat {
      flex\: 1;
      overflow-y\: auto;
      padding\: 20px 24px;
      display\: flex;
      flex-direction\: column;
      gap\: 14px;
      scroll-behavior\: smooth;
    }.burbuja {
      max-width\: 82%;
      padding\: 12px 16px;
      border-radius\: 8px;
      line-height\: 1.65;
      font-size\: 0.92rem;
      white-space\: pre-wrap;
      word-break\: break-word;
    }.burbuja.usuario {
      background\: #1a1a1a;
      color\: #f5f3ef;
      align-self\: flex-end;
      border-bottom-right-radius\: 2px;
    }.burbuja.asistente {
      background\: #f0ede8;
      color\: #1a1a1a;
      align-self\: flex-start;
      border-bottom-left-radius\: 2px;
    }.burbuja.escribiendo {
      color\: #aaa;
      font-style\: italic;
      background\: #f7f5f2;
    }.entrada {
      padding\: 14px 20px;
      border-top\: 1px solid #e8e4df;
      display\: flex;
      gap\: 10px;
      align-items\: flex-end;
    }

    textarea {
      flex\: 1;
      border\: 1px solid #d5d2cc;
      border-radius\: 6px;
      padding\: 10px 13px;
      font-size\: 0.92rem;
      font-family\: 'Georgia', serif;
      resize\: none;
      min-height\: 48px;
      max-height\: 120px;
      outline\: none;
      line-height\: 1.5;
      transition\: border-color 0.2s;
      overflow-y\: auto;
    }

    textarea\:focus { border-color\: #1a1a1a; }

    button {
      background\: #1a1a1a;
      color\: #fff;
      border\: none;
      border-radius\: 6px;
      padding\: 11px 20px;
      font-size\: 0.9rem;
      font-family\: 'Georgia', serif;
      cursor\: pointer;
      white-space\: nowrap;
      transition\: background 0.2s;
      height\: 48px;
    }

    button\:hover\:not(\:disabled) { background\: #333; }
    button\:disabled { background\: #bbb; cursor\: not-allowed; }.chat\:\:-webkit-scrollbar { width\: 4px; }.chat\:\:-webkit-scrollbar-thumb { background\: #d5d2cc; border-radius\: 4px; }
  </style>
</head>
<body>

<div class="contenedor">
  <div class="cabecera">
    <h1>Orientum</h1>
    <span>consulta libre</span>
  </div>

  <div class="chat" id="chat"></div>

  <div class="entrada">
    <textarea
      id="input"
      placeholder="Escribí tu consulta..."
      rows="1"
      onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); enviar(); }"
      oninput="this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,120)+'px';"
    ></textarea>
    <button id="btn" onclick="enviar()">Enviar</button>
  </div>
</div>

<script>
  const chat = document.getElementById("chat");
  const input = document.getElementById("input");
  const btn = document.getElementById("btn");

  function agregar(texto, clase) {
    const div = document.createElement("div");
    div.className = "burbuja " + clase;
    div.textContent = texto;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
  }

  async function enviar() {
    const texto = input.value.trim();
    if (!texto) return;

    input.value = "";
    input.style.height = "auto";
    btn.disabled = true;

    agregar(texto, "usuario");
    const espera = agregar("escribiendo...", "asistente escribiendo");

    try {
      const res = await fetch("/.netlify/functions/oracle", {
        method\: "POST",
        headers\: { "Content-Type"\: "application/json" },
        body\: JSON.stringify({ mensaje\: texto })
      });

      const data = await res.json();
      espera.remove();

      if (data.respuesta) {
        agregar(data.respuesta, "asistente");
      } else {
        agregar("No se pudo obtener respuesta.", "asistente");
      }

    } catch (err) {
      espera.remove();
      agregar("Error de conexión. Intentá nuevamente.", "asistente");
    }

    btn.disabled = false;
    input.focus();
  }
</script>

</body>
</html>
