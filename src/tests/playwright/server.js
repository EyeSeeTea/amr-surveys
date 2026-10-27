/* Serves the built app for the browser tests, as DHIS2 would, and forwards /dhis2 to the instance in .env.local
   with its token added here, so the token never reaches the browser. Anything that would change DHIS2 is refused
   (403): the tests are read-only.
   Usage: node src/tests/playwright/server.js <buildDir> <port> */
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const { getInstance, getToken } = require("./env");

const [buildDir, port] = process.argv.slice(2);
const root = path.resolve(buildDir);
const instance = getInstance();
const token = getToken();
const readOnlyMethods = ["GET", "HEAD", "OPTIONS"];
const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".webapp": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".map": "application/json",
};

function serveStatic(req, res) {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (urlPath === "/manifest.webapp") {
        // The app reads its DHIS2 address from the manifest: point it at this server's proxy.
        const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webapp"), "utf8"));
        manifest.activities.dhis.href = `http://localhost:${port}/dhis2`;
        res.writeHead(200, { "Content-Type": contentTypes[".webapp"] });
        return res.end(JSON.stringify(manifest));
    }
    const file = path.join(root, urlPath === "/" ? "index.html" : urlPath);
    if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404);
        return res.end();
    }
    res.writeHead(200, {
        "Content-Type": contentTypes[path.extname(file)] ?? "application/octet-stream",
    });
    fs.createReadStream(file).pipe(res);
}

function proxyToDhis2(req, res) {
    const target = new URL(instance.url + req.url.slice("/dhis2".length));
    const client = target.protocol === "https:" ? https : http;
    const headers = { ...req.headers, host: target.host, authorization: `ApiToken ${token}` };
    delete headers.cookie;
    delete headers.origin;
    delete headers.referer;
    const upstream = client.request(target, { method: req.method, headers }, upstreamRes => {
        res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
        upstreamRes.pipe(res);
    });
    upstream.on("error", error => {
        res.writeHead(502);
        res.end(`Proxy error: ${error.message}`);
    });
    req.pipe(upstream);
}

http.createServer((req, res) => {
    if (!req.url.startsWith("/dhis2/")) return serveStatic(req, res);
    if (!readOnlyMethods.includes(req.method)) {
        res.writeHead(403, { "Content-Type": "application/json", "x-e2e-blocked": "1" });
        return res.end(
            JSON.stringify({
                status: "ERROR",
                message: "Blocked by the read-only browser-test server",
            })
        );
    }
    proxyToDhis2(req, res);
}).listen(Number(port), () => {
    // eslint-disable-next-line no-console -- the server's start-up line, shown by Playwright
    console.log(`Serving ${root} on http://localhost:${port} -> ${instance.name} (read-only)`);
});
