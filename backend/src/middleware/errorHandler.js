const multer = require('multer');

// Terminal error handling for the API.
//
// Without these, anything thrown in middleware falls through to Express's
// default handler, which renders an HTML page — including a full stack trace
// whenever NODE_ENV is not 'production', which covers every preview deploy.
// It is also a functional problem: an oversized upload produced an opaque HTML
// 500 rather than a message the client could show.
//
// Everything below returns JSON, logs the real cause server-side, and never
// puts an internal message in the response body.

// 404 for any unmatched path. Mount after all routes, before the error handler.
function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, next) {
  // If the response has already started streaming, we cannot rewrite the
  // status — hand back to Express to close the connection.
  if (res.headersSent) return next(err);

  const mapped = classify(err);

  // Log the real error server-side. 5xx is unexpected and worth a stack trace;
  // 4xx is routine client input and only needs a line.
  if (mapped.status >= 500) {
    console.error(`❌ ${req.method} ${req.originalUrl} →`, err);
  } else {
    console.warn(`⚠️  ${req.method} ${req.originalUrl} → ${mapped.status} ${mapped.code}: ${err.message}`);
  }

  res.status(mapped.status).json({
    error: mapped.message,
    ...(mapped.code ? { code: mapped.code } : {})
  });
}

function classify(err) {
  // ── Uploads ──
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return { status: 413, code: 'FILE_TOO_LARGE', message: 'That image is too large. Please upload a file under 5MB.' };
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return { status: 400, code: 'UNEXPECTED_FILE', message: 'Unexpected file upload. Please try again with a single image.' };
    }
    return { status: 400, code: 'UPLOAD_FAILED', message: 'That file could not be uploaded. Please try a different image.' };
  }

  // Rejected by the file-type filter (see config/upload.js).
  if (err.code === 'INVALID_FILE_TYPE') {
    return { status: 400, code: 'INVALID_FILE_TYPE', message: err.message };
  }

  // ── CORS ──
  if (err.code === 'CORS_BLOCKED') {
    return { status: 403, code: 'CORS_BLOCKED', message: 'Request origin is not allowed.' };
  }

  // ── Body parsing (express.json / urlencoded) ──
  if (err.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'That request is too large.' };
  }
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return { status: 400, code: 'INVALID_JSON', message: 'Request body is not valid JSON.' };
  }

  // ── Anything explicitly marked by a caller ──
  const status = err.status || err.statusCode;
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return { status, code: err.code, message: err.expose === false ? 'Request could not be processed.' : err.message };
  }

  // ── Unexpected ── never surface the internal message.
  return { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' };
}

module.exports = { notFound, errorHandler };
