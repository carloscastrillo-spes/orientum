const https = require("https");

function llamarAnthropic(mensaje, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model\: "claude-3-5-sonnet-20241022",
      max_tokens\: 256,
      messages\: [{ role\: "user", content\: mensaje }]
    });

    const options = {
      hostname\: "api.anthropic.com",
      path\: "/v1/messages",
      method\: "POST",
      headers\: {
        "Content-Type"\: "application/json",
        "x-api-key"\: apiKey,
        "anthropic-version"\: "2023-06-01",
        "Content-Length"\: Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    });

    req.on("error", err => reject(err));
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin"\: "*",
    "Content-Type"\: "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode\: 200, headers, body\: "" };
  }

  // Test 1\: la función responde
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode\: 200,
      headers,
      body\: JSON.stringify({ respuesta\: "ERROR\: API key no encontrada en variables de entorno." })
    };
  }

  // Test 2\: la API de Anthropic responde
  try {
    const raw = await llamarAnthropic("Di solo la palabra\: funciona", apiKey);
    const parsed = JSON.parse(raw);

    if (parsed.error) {
      return {
        statusCode\: 200,
        headers,
        body\: JSON.stringify({ respuesta\: "ERROR ANTHROPIC\: " + JSON.stringify(parsed.error) })
      };
    }

    const texto = parsed.content?.?.text || "Sin texto en respuesta";
    return {
      statusCode\: 200,
      headers,
      body\: JSON.stringify({ respuesta\: "OK\: " + texto })
    };

  } catch (err) {
    return {
      statusCode\: 200,
      headers,
      body\: JSON.stringify({ respuesta\: "ERROR CATCH\: " + err.message })
    };
  }
};
