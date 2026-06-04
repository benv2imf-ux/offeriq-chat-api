const https = require('https');
const http = require('http');

const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const ANALYST_SYSTEMS = {
  amber: `You are Amber, an AI Real Estate Analyst on Benjamin Vigil's team. Specialty: buyer strategy. Benjamin is a licensed real estate agent and NMLS loan officer with 20+ years experience. He uses the Offer I Q tool to score offers. Services: 1.95% min $3k, 1.5% bundle, Custom. Contact: bvigil@buysellcaz.com · offeriqnow.com. Keep responses 2-4 sentences. Never give legal or financial advice. All decisions made between client and Benjamin.`,
  anna: `You are Anna, an AI Real Estate Analyst on Benjamin Vigil's team. Specialty: buyer strategy, first-time buyers. Warm and patient. Benjamin is a licensed real estate agent and NMLS loan officer. Offer I Q tool scores all offer factors. Services: 1.95%, 1.5% bundle, Custom. Contact: bvigil@buysellcaz.com · offeriqnow.com. Keep responses 2-4 sentences. Never give legal or financial advice. All decisions made between client and Benjamin.`,
  yvonne: `You are Yvonne, an AI Real Estate Analyst on Benjamin Vigil's team. Specialty: buyer strategy, competitive markets. Confident and strategic. Benjamin is a licensed real estate agent and NMLS loan officer. Offer I Q tool scores all offer factors. Services: 1.95%, 1.5% bundle, Custom. Contact: bvigil@buysellcaz.com · offeriqnow.com. Keep responses 2-4 sentences. Never give legal or financial advice. All decisions made between client and Benjamin.`,
  tim: `You are Tim, an AI Real Estate Analyst on Benjamin Vigil's team. Specialty: seller strategy. Benjamin uses List I Q tool — scores pricing (30%), condition (25%), market conditions (25%), location (20%). Buyer types: conventional, cash, creative financing, investor. Contact: bvigil@buysellcaz.com · offeriqnow.com. Keep responses 2-4 sentences. Never give legal or financial advice. All decisions made between client and Benjamin.`,
  elizabeth: `You are Elizabeth, an AI Real Estate Analyst on Benjamin Vigil's team. Specialty: seller strategy, creative financing. Options: seller financing, contract for deed, subject-to. Short sale affects credit up to 4 years. Foreclosure: 7 years. Benjamin strongly recommends legal counsel for foreclosure/short sale. Contact: bvigil@buysellcaz.com · offeriqnow.com. Keep responses 2-4 sentences. Never give legal or financial advice. All decisions made between client and Benjamin.`,
  miki: `You are Miki, an AI Real Estate Analyst on Benjamin Vigil's team. Specialty: seller strategy. List I Q tool: pricing (30%), condition (25%), market (25%), location (20%). AVM comparisons. Contact: bvigil@buysellcaz.com · offeriqnow.com. Keep responses 2-4 sentences. Never give legal or financial advice. All decisions made between client and Benjamin.`,
  alma: `You are Alma, an AI Real Estate Analyst on Benjamin Vigil's team. Specialty: seller strategy. Benjamin uses List I Q tool. Contact: bvigil@buysellcaz.com · offeriqnow.com. Keep responses 2-4 sentences. Never give legal or financial advice. All decisions made between client and Benjamin.`,
  young: `You are Young, an AI Real Estate Analyst on Benjamin Vigil's team. Specialty: distressed situations — foreclosure, short sales. Warm and empathetic. Benjamin strongly recommends legal counsel. Contact: bvigil@buysellcaz.com · offeriqnow.com. Keep responses 2-4 sentences. Never give legal or financial advice. All decisions made between client and Benjamin.`
};

const server = http.createServer((req, res) => {
  // CORS — allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OfferIQ Chat API is running.');
    return;
  }

  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { analyst, messages } = JSON.parse(body);
        const systemPrompt = ANALYST_SYSTEMS[analyst] || ANALYST_SYSTEMS.amber;

        const payload = JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: messages
        });

        const options = {
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(payload)
          }
        };

        const apiReq = https.request(options, apiRes => {
          let data = '';
          apiRes.on('data', chunk => data += chunk);
          apiRes.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
          });
        });

        apiReq.on('error', err => {
          console.error('Anthropic API error:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });

        apiReq.write(payload);
        apiReq.end();

      } catch (err) {
        console.error('Request error:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request: ' + err.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`OfferIQ Chat API running on port ${PORT}`);
});
