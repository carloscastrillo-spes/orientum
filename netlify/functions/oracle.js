var https = require('https');

exports.handler = function(event, context, callback) {

  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  function responder(texto) {
    callback(null, {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ respuesta: texto })
    });
  }

  if (event.httpMethod === 'OPTIONS') {
    return callback(null, { statusCode: 200, headers: headers, body: '' });
  }

  var key = process.env.ANTHROPIC_API_KEY;
  if (!key) { return responder('ERROR: sin API key'); }

  var msg = 'hola';
  try {
    var b = JSON.parse(event.body || '{}');
    if (b && b.mensaje) { msg = b.mensaje; }
  } catch(e) {}

  var payload = JSON.stringify({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    system: 'Eres Orientum. Identificas el mediador en toda consulta usando teoria mimetica y redes tripartitas.',
    messages: [{ role: 'user', content: msg }]
  });

  var options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    }
  };

  var req = https.request(options, function(res) {
    var data = '';
    res.on('data', function(chunk) { data = data + chunk; });
    res.on('end', function() {
      var r;
      try { r = JSON.parse(data); } catch(e) {
        return responder('ERROR PARSE: ' + data.substring(0, 300));
      }
      if (r.error) {
        return responder('ERROR API: ' + r.error.type + ' - ' + r.error.message);
      }
      if (!r.content || r.content.length === 0) {
        return responder('ERROR: sin content. Raw: ' + data.substring(0, 300));
      }
      var texto = '';
      for (var i = 0; i < r.content.length; i++) {
        if (r.content[i] && r.content[i].text) {
          texto = texto + r.content[i].text;
        }
      }
      if (!texto) {
        return responder('ERROR: texto vacio. Content: ' + JSON.stringify(r.content));
      }
      return responder(texto);
    });
  });

  req.on('error', function(e) { responder('ERROR RED: ' + e.message); });
  req.write(payload);
  req.end();
};
