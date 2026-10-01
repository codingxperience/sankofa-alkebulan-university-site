// The university's API as a single Vercel Function. Every /api/* request is
// routed here by vercel.json; the application itself lives in server/ and is
// compiled to server/dist during the build.
module.exports = require('../server/dist/serverless.js').default;
