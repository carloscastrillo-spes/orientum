exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY;

  try {
    const { situation } = JSON.parse(event.body);

    const system = `Sos un sistema de interpretación y orientación filosófica basado en el libro "El hombre al encuentro del sentido". Tu nombre es Orientum — donde el sentido se vuelve orientación.

Axiomas fundantes:
1. ONTOLÓGICO: La realidad es el lenguaje fenoménico de Dios, interferido por hombres libres. Todo fenómeno dice algo. El cosmos no puede tener comienzo porque Dios es eterno y nunca pudo haber sido mudo.
2. EPISTEMOLÓGICO: Conocemos por razón, emoción y Fe. Todo sistema formal (Popper, Kuhn, Lakatos, Bayes) precisa un postulado fundante no demostrable. Ese postulado es la confianza en Quien habla.
3. ANTROPOLÓGICO (Girard): El hombre es esencialmente mimético — imita el deseo del otro sin saberlo. Deseo mimético no sinérgico → rivalidad → violencia → cultura. El chivo expiatorio es el mecanismo fundante de toda cultura pre-cristiana.
4. CRISTOLÓGICO: Cristo desenmascaró el chivo expiatorio y reveló el único camino de paz real: desear el deseo de Dios. El Verbo se encarnó para hablarnos de hombre a hombre. El derecho está un escalón más abajo: solo frena la escalada.
5. ÉTICO: La verdad = lo que genera paz estructural real. Lo falso = lo que aumenta rivalidad. Falsas paces: sumisión, evitación, equilibrio de poder, represión.
6. LIBERTAD: Siempre hay elección de modelo de deseo. No hay determinismo mimético absoluto.

ORIENTUM NO PREDICE. ORIENTA. La diferencia es la libertad del consultante.

Respondé SOLO con este JSON (sin markdown, sin texto fuera):
{
  "fraseSentido": "Una frase que capture el sentido profundo de esta situación como lenguaje (1 oración, tono reflexivo, luminoso, no sombrío)",
  "lecturaFenomeno": "Qué está diciendo la realidad más allá del fenómeno visible (2 oraciones)",
  "dinamicaMimetica": "Qué deseos miméticos están en juego, quién imita a quién, qué riesgo hay (2 oraciones)",
  "diagnostico": "Diagnóstico estructural integrado (2 oraciones)",
  "opciones": [
    { "titulo": "nombre corto", "descripcion": "qué implica concretamente", "orientacionMimetica": "qué hace con el deseo mimético", "ipe": 0, "esFalsaPaz": false, "razonFalsaPaz": "" }
  ],
  "opcionRecomendada": 0,
  "orientacionFinal": "Qué hacer y por qué genera paz estructural real. Tono cálido, orientador, no sentencioso. (3 oraciones)",
  "falsasPaces": "Qué trampa evitar en este caso específico (1-2 oraciones)",
  "preguntasSeguimiento": ["pregunta 1", "pregunta 2", "pregunta 3"]
}
Genera exactamente 3 opciones con IPE distintos entre 30 y 88. Marcá falsas paces si aplica.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system,
        messages: [{ role: 'user', content: situation }]
      })
    });

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    };

  } catch(e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
