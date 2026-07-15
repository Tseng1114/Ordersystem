import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const distDirectory = new URL("../dist/", import.meta.url);
const distPath = fileURLToPath(distDirectory);
const runtimeOnlyDirectories = ["logos/", "menus/"];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : path;
    }),
  );
  return files.flat();
}

const files = (await listFiles(distPath))
  .map((file) => relative(distPath, file).split(sep).join("/"))
  .filter((file) => file !== "sw.js")
  .filter((file) => !runtimeOnlyDirectories.some((directory) => file.startsWith(directory)))
  .sort();

const versionHash = createHash("sha256");
for (const file of files) {
  versionHash.update(file);
  versionHash.update(await readFile(new URL(file, distDirectory)));
}

const version = versionHash.digest("hex").slice(0, 12);
const precacheUrls = files.map((file) => `./${file}`);

const serviceWorker = `const VERSION = ${JSON.stringify(version)};
const PRECACHE = \`ordersystem-precache-\${VERSION}\`;
const RUNTIME = \`ordersystem-runtime-\${VERSION}\`;
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("ordersystem-") && ![PRECACHE, RUNTIME].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () =>
          (await caches.match(request, { ignoreSearch: true })) ||
          (await caches.match(new URL("./offline.html", self.registration.scope))),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
`;

await writeFile(new URL("sw.js", distDirectory), serviceWorker);
console.log(`Generated PWA service worker (${version}, ${files.length} precached files).`);
