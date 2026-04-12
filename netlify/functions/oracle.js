const https = require("https");

const SYSTEM_PROMPT = `Eres Orientum, un asistente que opera bajo una ontología estructural precisa que integra la teoría mimética de René Girard y el sistema de redes tripartitas de Carlos Castrillo. Toda relación significativa es triangular: ORIGEN → MEDIADOR → DESTINO. Sin mediador la relación colapsa en díada y el conflicto se vuelve simétrico. Identificá siempre el mediador. Orientá sin decidir. La pragmática pertenece al consultante.`;

function llamarAnthropic(userMessage, apiKey) {
  return new Promise((resolve, reject) => {
    const bodyObj = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }]
    };
    const body = JSON.stringify(bodyObj);
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
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => { resolve(data); });
    });
    req.on("error", (err) => { reject(err); });
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ respuesta: "ERROR: falta la API key en Netlify." })
    };
  }

  let mensaje = "";
  try {
    const parsed = JSON.parse(event.body || "{}");
    mensaje = (parsed.mensaje || "").trim();
  } catch (e) {
    mensaje = "hola";
  }

  if (mensaje.length < 1) {
    mensaje = "hola";
  }

  try {
    const raw = await llamarAnthropic(mensaje, apiKey);
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ respuesta: "ERROR PARSE: " + raw.substring(0, 300) })
      };
    }

    if (parsed.error) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ respuesta: "ERROR API: " + parsed.error.type + " — " + parsed.error.message })
      };
    }

    const texto = parsed.content && parsed.content&& parsed.content.text;
    if (!texto) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ respuesta: "ERROR: respuesta vacía. Raw: " + raw.substring(0, 300) })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ respuesta: texto })
    };

  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ respuesta: "ERROR CATCH: " + err.message })
    };
  }
};
