import { highlightCode } from "$lib/highlightCode";
import type { TocEntry } from "$lib/types";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => ({
  title: "responsesAreSame - @serwist/broadcast-update",
  toc: [
    {
      title: "responsesAreSame",
      id: "responses-are-same",
      children: [
        {
          title: "First added",
          id: "first-added",
        },
        {
          title: "About",
          id: "about",
        },
        {
          title: "Parameters",
          id: "parameters",
        },
        {
          title: "Usage",
          id: "usage",
        },
      ],
    },
  ] satisfies TocEntry[],
  code: {
    usage: highlightCode(
      locals.highlighter,
      {
        "sw.ts": {
          code: `import { responsesAreSame, defaultHeadersToCheck } from "@serwist/broadcast-update";

const cacheName = "api-cache";
const request = new Request("https://example.com/api");

const cache = await caches.open(cacheName);
const oldResponse = await cache.match(request);
const newResponse = await fetch(request);

if (!responsesAreSame(oldResponse, newResponse, defaultHeadersToCheck)) {
  const windows = await self.clients.matchAll({ type: "window" });
  for (const win of windows) {
    win.postMessage({ type: "CACHE_UPDATED", message: "Update now!" });
  }
}`,
          lang: "typescript",
        },
      },
      { idPrefix: "usage-example" },
    ),
  },
});