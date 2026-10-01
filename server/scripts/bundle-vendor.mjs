// Bundles sanitize-html and everything it loads into one CommonJS file,
// vendor/sanitize-html.cjs, which the API imports as '#sanitize-html'.
//
// sanitize-html is CommonJS, but the HTML parser it relies on (htmlparser2)
// has been published only as an ES module since version 11. Loading one from
// the other needs require(esm), which Vercel's Node.js runtime does not allow,
// so the API failed to start there with ERR_REQUIRE_ESM. Bundling converts
// the parser to CommonJS ahead of time, and the API works the same on any
// Node.js runtime.
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'package.json'));

const entry = require.resolve('sanitize-html');
const { version } = JSON.parse(readFileSync(join(dirname(entry), 'package.json'), 'utf8'));

await build({
  entryPoints: [entry],
  outfile: join(root, 'vendor', 'sanitize-html.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  legalComments: 'inline',
  banner: { js: `// sanitize-html ${version} and its dependencies, bundled by scripts/bundle-vendor.mjs. Do not edit.` },
  logLevel: 'warning',
});
