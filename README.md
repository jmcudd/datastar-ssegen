![Version](https://img.shields.io/github/package-json/v/jmcudd/datastar-ssegen?filename=package.json)
![Stars](https://img.shields.io/github/stars/jmcudd/datastar-ssegen?style=flat)

# datastar-ssegen

## Overview

The `datastar-ssegen` is a backend JavaScript module designed to generate Server-Sent Events (SSE) for connected [Datastar](https://data-star.dev/) clients. It supports popular server frameworks such as Express.js, Node.js, and Hyper Express.js, and Bun and Elysia.

This package is engineered to integrate tightly with request and response objects of these backend frameworks, enabling efficient and reactive web application development.

### Key Features

- Real-time updates with Server-Sent Events tailored for Datastar clients
- Seamless integration with Express.js, Hyper Express.js, and Node HTTP

### Installation

Install the package via npm:

```bash
npm install datastar-ssegen
```

### Quick Start Example with Express.js

Here's a straightforward example of setting up an Express.js server with the datastar-ssegen:

```javascript
import express from 'express';
import { ServerSentEventGenerator } from 'datastar-ssegen';

const app = express();
app.use(express.json());

app.get('/qoute', (req,res)=> {
  const sse = ServerSentEventGenerator(req, res);
  const qoutes = [
    "Any app that can be written in JavaScript, will eventually be written in JavaScript. - Jeff Atwood",
    "JavaScript is the world's most misunderstood programming language. - Douglas Crockford",
    "The strength of JavaScript is that you can do anything. The weakness is that you will. - Reg Braithwaite",
  ];
  const randomQuote = (arr) => arr[Math.floor(Math.random() * arr.length)];
  await sse.MergeFragments(`<div id="quote">${randomQuote(qoutes)}</div>`);
  await sse.MergeSignals({ lastUpdate: Date.now() });
  res.end();
});
app.get('/clock', (req, res)=> {
  const sse = ServerSentEventGenerator(req, res);
  setInterval(async () => {
    await sse.MergeFragments(`<div id="clock">Current Time: ${new Date()}</div>`);
  }, 1000);
});

const PORT = 3101;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

### Client Interaction Example

Here's a simple HTML page to interact with the server:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar/bundles/datastar.js"></script>
  <title>SSE Example</title>
</head>
<body>
  <h1>SSE Demo</h1>
  <div id="qoute" data-on-load="sse('/qoute')">Qoute: </div><button onclick="sse('/qoute')">Get New Qoute</button>
  <div id="clock" data-on-load="sse('/clock')"></div>
</body>
</html>
```


### Quick Start Example with Elysia

```javascript
import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import { ServerSentEventGenerator } from "datastar-ssegen";

const app = new Elysia()
  .use(html())
  .get(
    "/",
    () =>
      `<html>
      <head>
        <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar/bundles/datastar.js"></script>
      </head>
      <body data-on-load="sse('/feed')">
        <div id="hello">???</div>
      </body>
      </html>`
  )
  .get("/feed", function* ({ request, set }) {
    const sse = ServerSentEventGenerator(request);
    set.headers = sse.headers;
    yield sse.MergeFragments(`<div id="hello">Hello!</div>`);
  })

  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
```

### Quick Start Example with Bun 

Using this with Bun requires you to create the response. Below is an example of how to integrate the datastar-ssegen with a Stream:

```javascript
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
```

### Available Functions

The `ServerSentEventGenerator` provides several functions to facilitate communication with connected Datastar clients using Server-Sent Events:

- **`ServerSentEventGenerator(request, response)`**: Initializes SSE communication with the specified request and response.

- **`ReadSignals(signals)`**: Reads and merges signals based on HTTP methods with predefined signals, useful for parsing query or body data sent to the server.

- **`MergeFragments(fragments, options)`**: Sends a merge fragments event to update HTML content on the client. Options include `selector`, `mergeMode`, `settleDuration`, and `useViewTransition`.

- **`RemoveFragments(selector, options)`**: Dispatches events to remove HTML elements based on a CSS selector. Options can set a `settleDuration` or `useViewTransition`.

- **`MergeSignals(signals, options)`**: Sends a merge signals event to update or add client-side signals. Options may include `onlyIfMissing`.

- **`RemoveSignals(paths, options)`**: Sends an event to remove specific client-side signals identified by paths.

- **`ExecuteScript(script, options)`**: Directs the client to execute specified JavaScript code. Options can enable `autoRemove` of the script after execution.

This expanded set provides comprehensive functionality to build interactive web applications with real-time updates and dynamic HTML and signal management.
