import { ServerSentEventGenerator } from "../index.js";
const PORT = 3103;
console.log(`Bun server http://localhost:${PORT}`);
Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/") {
      return new Response(
        `<html>
          <head>
            <title>Example Bun</title>
            <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar/bundles/datastar.js"></script>
          </head>
          <body data-signals="{time:''}" data-on-load="sse('/feed')">
            <div data-text="time.value"></div>
          </body>
          </html>`,
        {
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }
    if (url.pathname === "/feed") {
      const sse = ServerSentEventGenerator(req);
      const stream = new ReadableStream({
        start(controller) {
          setInterval(() => {
            controller.enqueue(sse.MergeSignals({ time: new Date() }));
          }, 1000);
          //controller.close();
        },
      });
      return new Response(stream, sse.headers);
    }
    return new Response("404!");
  },
});
