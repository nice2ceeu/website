import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(path.resolve(here,'../../package.json'));
await require('esbuild').build({entryPoints:[path.join(here,'review-entry.mjs')],outfile:path.join(here,'review.js'),bundle:true,format:'esm',platform:'browser'});
