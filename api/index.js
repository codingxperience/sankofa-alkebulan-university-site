// The university's API as a single Vercel Function. Every /api/* request is
// routed here by vercel.json; the application itself lives in server/ and is
// compiled to server/dist during the build.
//
// If the compiled API cannot even be loaded (a file missing from the
// deployment, say), every request is answered with the reason instead of a
// bare FUNCTION_INVOCATION_FAILED page.
'use strict';

let handler;
let loadFailure;
try {
  handler = require('../server/dist/serverless.js').default;
} catch (error) {
  loadFailure = error;
  console.error('The API could not be loaded:', error);
}

function summary(error) {
  const message = String((error && error.message) || error)
    .split(/\nRequire stack:/)[0]
    .replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s'"`]+/gi, '[address hidden]')
    .trim()
    .slice(0, 600);
  return { name: (error && error.name) || 'Error', message, ...(error && typeof error.code === 'string' ? { code: error.code } : {}) };
}

module.exports = function sankofaApi(req, res) {
  if (loadFailure) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(
      JSON.stringify({
        error: { code: 'unavailable', message: 'The API could not be loaded. The details below say why.', details: summary(loadFailure) },
      }),
    );
    return;
  }
  return handler(req, res);
};
