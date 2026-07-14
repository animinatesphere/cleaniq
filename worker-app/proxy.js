/**
 * Dev-only CORS proxy — run this alongside expo start:
 *   node proxy.js
 *
 * Listens on http://localhost:8090 and forwards all requests to
 * https://api.cleaniqservices.com, adding CORS headers so the browser
 * on localhost:8082 can call the API without a CORS error.
 */
const http  = require("http");
const https = require("https");

const PROXY_PORT = 8090;
const API_HOST   = "api.cleaniqservices.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const server = http.createServer((req, res) => {
  // Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const options = {
    hostname: API_HOST,
    port: 443,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: API_HOST },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    // Merge real response headers with our CORS headers
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      ...CORS_HEADERS,
    });
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error("[proxy error]", err.message);
    if (!res.headersSent) {
      res.writeHead(502, CORS_HEADERS);
      res.end(JSON.stringify({ error: err.message }));
    }
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PROXY_PORT, () => {
  console.log(`\n[proxy] Ready`);
  console.log(`  Local  : http://localhost:${PROXY_PORT}`);
  console.log(`  Target : https://${API_HOST}\n`);
});
