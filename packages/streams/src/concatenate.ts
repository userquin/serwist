/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import { assert, Deferred, SerwistError, logger } from "serwist/internal";

import type { StreamSource } from "./_types.js";

/**
 * Takes either a Response, a ReadableStream, or a
 * [BodyInit](https://fetch.spec.whatwg.org/#bodyinit) and returns the
 * ReadableStreamReader object associated with it.
 *
 * @param source
 * @returns
 * @private
 */
function _getReaderFromSource(source: StreamSource): ReadableStreamReader<unknown> {
  if (source instanceof Response) {
    // See https://github.com/GoogleChrome/workbox/issues/2998
    if (source.body) {
      return source.body.getReader();
    }
    throw new SerwistError("opaque-streams-source", { type: source.type });
  }
  if (source instanceof ReadableStream) {
    return source.getReader();
  }
  return new Response(source as BodyInit).body!.getReader();
}

/**
 * Takes multiple source Promises, each of which could resolve to a Response, a
 * ReadableStream, or a [BodyInit](https://fetch.spec.whatwg.org/#bodyinit).
 *
 * Returns an object exposing a ReadableStream with each individual stream's
 * data returned in sequence, along with a Promise which signals when the
 * stream is finished (useful for passing to a FetchEvent's waitUntil()).
 *
 * @param sourcePromises
 * @returns
 */
function concatenate(sourcePromises: Promise<StreamSource>[]): {
  done: Promise<void>;
  stream: ReadableStream;
} {
  if (process.env.NODE_ENV !== "production") {
    assert!.isArray(sourcePromises, {
      moduleName: "@serwist/streams",
      funcName: "concatenate",
      paramName: "sourcePromises",
    });
  }

  const readerPromises = sourcePromises.map((sourcePromise) => {
    return Promise.resolve(sourcePromise).then((source) => {
      return _getReaderFromSource(source);
    });
  });

  const streamDeferred: Deferred<void> = new Deferred();

  let i = 0;
  const logMessages: any[] = [];
  const stream = new ReadableStream({
    pull(controller: ReadableStreamDefaultController<any>) {
      return readerPromises[i]
        .then((reader) => {
          if (reader instanceof ReadableStreamDefaultReader) {
            return reader.read();
          }
          return;
        })
        .then((result) => {
          if (result?.done) {
            if (process.env.NODE_ENV !== "production") {
              logMessages.push(["Reached the end of source:", sourcePromises[i]]);
            }

            i++;
            if (i >= readerPromises.length) {
              // Log all the messages in the group at once in a single group.
              if (process.env.NODE_ENV !== "production") {
                logger.groupCollapsed(`Concatenating ${readerPromises.length} sources.`);
                for (const message of logMessages) {
                  if (Array.isArray(message)) {
                    logger.log(...message);
                  } else {
                    logger.log(message);
                  }
                }
                logger.log("Finished reading all sources.");
                logger.groupEnd();
              }

              controller.close();
              streamDeferred.resolve();
              return;
            }

            // The `pull` method is defined because we're inside it.
            return this.pull!(controller);
          }
          controller.enqueue(result?.value);
        })
        .catch((error) => {
          if (process.env.NODE_ENV !== "production") {
            logger.error("An error occurred:", error);
          }
          streamDeferred.reject(error);
          throw error;
        });
    },

    cancel() {
      if (process.env.NODE_ENV !== "production") {
        logger.warn("The ReadableStream was cancelled.");
      }

      streamDeferred.resolve();
    },
  });

  return { done: streamDeferred.promise, stream };
}

export { concatenate };
