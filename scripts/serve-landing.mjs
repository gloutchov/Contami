import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const landingRoot = resolve(fileURLToPath(new URL("../landing/", import.meta.url)));
const port = Number.parseInt(process.env.LANDING_PORT ?? "4174", 10);
const projectPath = "/Contami";
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".mp4", "video/mp4"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

const securityHeaders = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'self'; img-src 'self'; media-src 'self'; script-src 'self'; style-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

function send(response, status, body = "") {
  response.writeHead(status, { ...securityHeaders, "Content-Type": "text/plain; charset=utf-8" });
  response.end(body);
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    send(response, 405, "Method not allowed");
    return;
  }

  try {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const decodedPath = decodeURIComponent(url.pathname);
    const publicPath = decodedPath === projectPath
      ? "/"
      : decodedPath.startsWith(`${projectPath}/`)
        ? decodedPath.slice(projectPath.length)
        : decodedPath;
    const relativePath = publicPath === "/" ? "index.html" : publicPath.replace(/^\/+/, "");
    const filePath = resolve(landingRoot, relativePath);
    if (filePath !== landingRoot && !filePath.startsWith(`${landingRoot}${sep}`)) {
      send(response, 403, "Forbidden");
      return;
    }

    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) {
      send(response, 404, "Not found");
      return;
    }

    response.writeHead(200, {
      ...securityHeaders,
      "Content-Length": fileStats.size,
      "Content-Type": contentTypes.get(extname(filePath).toLowerCase()) ?? "application/octet-stream",
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(filePath).pipe(response);
  } catch (error) {
    send(response, error?.code === "ENOENT" ? 404 : 400, error?.code === "ENOENT" ? "Not found" : "Bad request");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`ContaMì landing preview: http://127.0.0.1:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
