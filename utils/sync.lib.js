import cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { ensureDir, exists } from "https://deno.land/std@0.173.0/fs/mod.ts";
import * as yaml from "https://deno.land/x/js_yaml_port@3.14.0/js-yaml.js";

const CACHE_DIR = "./cache";

export async function loadJSONUrl(url, options) {
  const resp = await fetch(url, options);
  return resp.json();
}

export async function loadYAMLUrl(url, options) {
  const resp = await fetch(url, options);
  return yaml.load(await resp.text());
}

export async function loadTextUrl(url, options) {
  const resp = await fetch(url, options);
  return resp.text();
}

export async function loadHtmlUrl(url) {
  const cacheTimeout = 3600;
  await ensureDir(CACHE_DIR);
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", (new TextEncoder()).encode(url)),
    ),
  ).map((b) => b.toString(16).padStart(2, "0")).join("");
  const cacheFn = `${CACHE_DIR}/${hash}`;

  if (await exists(cacheFn)) {
    console.log(`Cache found! ${hash}`);
    return cheerio.load(await Deno.readTextFile(cacheFn));
  }

  console.log(`Getting ${url}`);
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
    },
  });
  const output = await resp.text();
  await Deno.writeTextFile(cacheFn, output);
  return cheerio.load(output);
}

export async function loadHtmlLocal(fn) {
  const text = cheerio.load(await Deno.readTextFile(fn));
  return text;
}

export function formatId(str) {
  return str
    .normalize("NFD")
    .toLowerCase()
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/\./, "-")
    .replace(/\s+/g, "-")
    .replace(/-$/, "");
}
