const http = require("http");
const next = require("next");

const port = Number(process.env.PORT || 3001);
const hostname = process.env.HOST || "0.0.0.0";
const dev = false;

const app = next({
  dev,
  dir: __dirname,
  hostname,
  port,
});

const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => handle(req, res));

    server.listen(port, hostname, () => {
      console.log(`template-vendor listening on http://${hostname}:${port}`);
    });
  })
  .catch((error) => {
    console.error("template-vendor failed to start", error);
    process.exit(1);
  });
