const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/socket.io",
  });

  if (dev) {
    require("ts-node").register({
      project: path.join(process.cwd(), "tsconfig.json"),
      transpileOnly: true,
      compilerOptions: {
        module: "commonjs",
        moduleResolution: "node",
      },
    });
    const { initSocketHandlers } = require("./lib/socket.ts");
    initSocketHandlers(io);
  } else {
    const { initSocketHandlers } = require("./.next/server/lib/socket.js");
    initSocketHandlers(io);
  }

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
