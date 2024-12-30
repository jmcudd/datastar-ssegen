// @ts-check
import url from "url";
import querystring from "querystring";

/**
 * @typedef {object} ServerSentEventMethods
 * @property {Function} _send - Sends a server-sent event.
 * @property {Function} ReadSignals - Reads signals based on HTTP methods and merges them with predefined signals.
 * @property {Function} MergeFragments - Sends a merge fragments event with specified options.
 * @property {Function} RemoveFragments - Sends a remove fragments event.
 * @property {Function} MergeSignals - Sends a merge signals event, with merging options.
 * @property {Function} RemoveSignals - Sends a remove signals event, requires signal paths.
 * @property {Function} ExecuteScript - Executes a defined script on the client-side.
 */

/**
 * @typedef {object} SendOptions
 * @property {number|null} [eventId] - The ID of the event.
 * @property {number|null} [retryDuration] - Duration in milliseconds to wait before attempting a retry.
 */

/**
 * @typedef {object} MergeFragmentsOptions
 * @property {string|null} [selector] - CSS selector to scope the merge action.
 * @property {string} [mergeMode=morph] - Mode to use for merging fragments.
 * @property {number} [settleDuration=300] - Duration for settling the merge.
 * @property {boolean|null} [useViewTransition] - Use CSS view transitions if supported.
 * @property {number|null} [eventId] - Event ID for the merge fragments event.
 * @property {number|null} [retryDuration] - Retry duration for the event.
 */

/**
 * @typedef {object} RemoveFragmentsOptions
 * @property {number} [settleDuration] - Duration for settling the removal.
 * @property {boolean|null} [useViewTransition] - Use CSS view transitions if supported.
 * @property {number|null} [eventId] - Event ID for the remove fragments event.
 * @property {number|null} [retryDuration] - Retry duration for the event.
 */

/**
 * @typedef {object} MergeSignalsOptions
 * @property {boolean} [onlyIfMissing=false] - Merge only if the signal is missing.
 * @property {number|null} [eventId] - Event ID for the merge signals event.
 * @property {number|null} [retryDuration] - Retry duration for the event.
 */

/**
 * @typedef {object} ExecuteScriptOptions
 * @property {boolean|null} [autoRemove] - Automatically remove the script after execution.
 * @property {number|null} [eventId] - Event ID for the execute script event.
 * @property {number|null} [retryDuration] - Retry duration for the event.
 */

/**
 * @typedef {Object} HttpRequest
 * @property {string} method - The HTTP method, e.g., 'GET', 'POST', etc.
 * @property {string} url - The URL of the request.
 * @property {Object.<string, string>} headers - The HTTP headers.
 * @property {Object} [body] - The payload of the request.
 * @property {Function} [json] - Parses the request body
 * @property {Function} [on] - Adds event handlers to the request
 */

/**
 * @typedef {Object} HttpResponse
 * @property {number} statusCode - The HTTP status code, e.g., 200, 404, etc.
 * @property {Object.<string, string>} headers - The HTTP headers.
 * @property {Object|string} [body] - The response body.
 * @property {Function} setHeader - Sets a header on the response
 * @property {Function} write - Writes to the response body
 */

/**
 * Initializes the server-sent event generator.
 *
 * @param {HttpRequest} request - The request object.
 * @param {HttpResponse} response - The response object.
 * @returns {ServerSentEventMethods} Methods for manipulating server-sent events.
 */
export function ServerSentEventGenerator(request, response) {
  const generatorMethods = {
    headersSent: false,
    headers: {
      "Cache-Control": "no-cache",
      Connnection: "keep-alive",
      "Content-Type": "text/event-stream",
    },
    req: request,
    res: response,
    /**
     * Sends a server-sent event (SSE) to the client.
     *
     * @param {string} eventType - The type of the event.
     * @param {string[]} dataLines - Lines of data to send.
     * @param {SendOptions} [sendOptions] - Additional options for sending events.
     */
    _send: function (
      eventType,
      dataLines,
      sendOptions = {
        eventId: null,
        retryDuration: 1000,
      }
    ) {
      //Prepare the message for sending.
      let data = dataLines.map((line) => `data: ${line}\n`).join("") + "\n";
      let eventString = "";
      eventString += `comment: "dev"\n`;
      if (sendOptions.eventId != null) {
        eventString += `id: ${sendOptions.eventId}\n`;
      }
      if (eventType) {
        eventString += `event: ${eventType}\n`;
      }
      eventString += `retry: ${sendOptions.retryDuration}\n`;
      eventString += data;

      //Send Event
      if (!this.headersSent) {
        if (!process?.isBun) {
          Object.keys(this.headers).forEach((key) => {
            this.res?.setHeader(key, this.headers[key]);
          });
        }
        this.headersSent = true;
      }

      if (this.res?.write) {
        this.res.write(eventString);
      }

      return eventString;
    },

    /**
     * Reads signals based on HTTP methods and merges them with provided signals.
     *
     * @param {object} signals - Predefined signals to merge with.
     * @returns {Promise<object>} Merged signals object.
     */
    ReadSignals: async function (signals) {
      if (this.req.method === "GET") {
        // Parse the URL
        const parsedUrl = url.parse(this.req.url);
        const parsedQuery = querystring.parse(parsedUrl.query);
        const datastarParam = parsedQuery.datastar;

        const query = JSON.parse(datastarParam);
        return {
          ...signals,
          ...query,
        };
      } else {
        let body = this.req?.body;
        if (this.req?.json) {
          body = await this.req.json();
        }

        if (!body) {
          body = await new Promise((resolve, reject) => {
            let chunks = "";
            this.req.on("data", (chunk) => {
              chunks += chunk;
            });
            this.req.on("end", () => {
              resolve(JSON.parse(chunks));
            });
          });
        }

        return { ...signals, ...body };
      }
    },

    /**
     * Sends a merge fragments event.
     *
     * @param {string[]|string} fragments - Array of fragment identifiers.
     * @param {MergeFragmentsOptions} options - Additional options for merging.
     * @throws Will throw an error if fragments are missing.
     */
    MergeFragments: function (
      fragments,
      options = {
        selector: null,
        mergeMode: "morph",
        settleDuration: 300,
        useViewTransition: null,
        eventId: null,
        retryDuration: null,
      }
    ) {
      let dataLines = [];
      if (options?.selector != null)
        dataLines.push(`selector ${options.selector}`);
      if (options?.settleDuration != null)
        dataLines.push(`settleDuration ${options.settleDuration}`);
      if (options?.useViewTransition != null)
        dataLines.push(`useViewTransition ${options.useViewTransition}`);
      if (fragments) {
        if (typeof fragments === "string") {
          // Handle case where 'fragments' is a string
          dataLines.push(`fragments ${fragments.replace(/[\r\n]+/g, "")}`);
        } else if (Array.isArray(fragments)) {
          // Handle case where 'fragments' is an array
          fragments.forEach((frag) => {
            dataLines.push(`fragments ${frag.replace(/[\r\n]+/g, "")}`);
          });
        } else {
          throw Error("Invalid type for fragments. Expected string or array.");
        }
      } else {
        throw Error("MergeFragments missing fragment(s).");
      }
      return this._send("datastar-merge-fragments", dataLines, {
        eventId: options?.eventId,
        retryDuration: options?.retryDuration,
      });
    },
    /**
     * Sends a remove fragments event.
     *
     * @param {string} selector - CSS selector of fragments to remove.
     * @param {RemoveFragmentsOptions} options - Additional options for removing.
     * @throws Will throw an error if selector is missing.
     */
    RemoveFragments: function (selector, options) {
      let dataLines = [];
      if (selector) {
        dataLines.push(`selector ${selector}`);
      } else {
        throw Error("RemoveFragments missing selector.");
      }
      if (options?.settleDuration != null)
        dataLines.push(`settleDuration ${options.settleDuration}`);
      if (options?.useViewTransition != null)
        dataLines.push(`useViewTransition ${options.useViewTransition}`);
      return this._send(`datastar-remove-fragments`, dataLines, {
        eventId: options?.eventId,
        retryDuration: options?.retryDuration,
      });
    },

    /**
     * Sends a merge signals event.
     *
     * @param {object} signals - Signals to merge.
     * @param {MergeSignalsOptions} options - Additional options for merging.
     * @throws Will throw an error if signals are missing.
     */
    MergeSignals: function (signals, options) {
      let dataLines = [];
      if (options?.onlyIfMissing === true) {
        dataLines.push(`onlyIfMissing true`);
      }
      if (signals) {
        dataLines.push(`signals ${JSON.stringify(signals)}`);
      } else {
        throw Error("MergeSignals missing signals.");
      }
      return this._send(`datastar-merge-signals`, dataLines, {
        eventId: options?.eventId,
        retryDuration: options?.retryDuration,
      });
    },
    /**
     * Sends a remove signals event.
     *
     * @param {string[]} paths - Paths of signals to remove.
     * @param {SendOptions} options - Additional options for removing signals.
     * @throws Will throw an error if paths are missing.
     */
    RemoveSignals: function (paths, options) {
      /** @type {Array<string>} */
      let dataLines = [];
      if (paths) {
        paths
          .map((path) => {
            dataLines.push(`paths ${path}`);
          })
          .join("");
      } else {
        throw Error("RemoveSignals missing paths");
      }
      return this._send(`datastar-remove-signals`, dataLines, {
        eventId: options?.eventId,
        retryDuration: options?.retryDuration,
      });
    },

    /**
     * Executes a script on the client-side.
     *
     * @param {string} script - Script code to execute.
     * @param {ExecuteScriptOptions} options - Additional options for execution.
     */
    ExecuteScript: function (script, options) {
      let dataLines = [];
      if (options?.autoRemove != null) {
        dataLines.push(`autoRemove ${options.autoRemove}`);
      }

      if (script) {
        const lines = script.split("\n");
        let insideBlockComment = false;
        const processedLines = lines
          .map((line) => {
            line = line.trim();
            let result = [];
            let isInString = false;
            let isEscape = false;

            for (let i = 0; i < line.length; i++) {
              const char = line[i];

              if (insideBlockComment) {
                // Check for end of block comment
                if (char === "*" && line[i + 1] === "/") {
                  insideBlockComment = false;
                  i++; // Skip the '/'
                }
                continue;
              }

              if (isInString) {
                result.push(char);
                if (char === "\\" && !isEscape) {
                  isEscape = true; // Detect escaping
                } else if ((char === '"' || char === "'") && !isEscape) {
                  isInString = false; // End of the string literal
                } else {
                  isEscape = false;
                }
              } else {
                // Not inside any string
                if (char === '"' || char === "'") {
                  isInString = true;
                  result.push(char);
                } else if (char === "/" && line[i + 1] === "/") {
                  break; // Start of single-line comment, ignore rest
                } else if (char === "/" && line[i + 1] === "*") {
                  insideBlockComment = true; // Begin block comment
                  i++; // Skip the '*'
                } else {
                  result.push(char);
                }
              }
            }

            // Join the result and ensure it ends with a semicolon if not empty
            const codePart = result.join("").trim();
            return codePart;
          })
          .filter((line) => line.length > 0);

        const singleLineScript = processedLines.join(" ");
        dataLines.push(`script ${singleLineScript}`);
      }

      return this._send(`datastar-execute-script`, dataLines, {
        eventId: options?.eventId,
        retryDuration: options?.retryDuration,
      });
    },
  };
  return Object.assign(
    {
      headersSent: false,
      req: request,
      res: response,
    },
    generatorMethods
  );
}
