const mongoose = require('mongoose');

const DUPLICATE_EMAIL_MESSAGE = 'This email is already registered for the event';

function send(res, status, message, errors) {
  return res.status(status).json({
    success: false,
    message,
    errors: errors || [message],
  });
}

function describeValidationError(error) {
  if (error.name === 'CastError') {
    return `${error.path} must be a valid ${String(error.kind).toLowerCase()}`;
  }
  return error.message;
}

function notFound(req, res) {
  send(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

function errorHandler(err, req, res, next) {
  if (err.isOperational) {
    return send(res, err.statusCode, err.message, err.errors);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map(describeValidationError);
    return send(res, 400, errors.length === 1 ? errors[0] : 'Validation failed', errors);
  }

  if (err instanceof mongoose.Error.CastError) {
    if (err.path === '_id') {
      return send(res, 400, 'Invalid registration ID format');
    }
    const message = describeValidationError(err);
    return send(res, 400, message);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    if (!field || field === 'collegeEmail') {
      return send(res, 409, DUPLICATE_EMAIL_MESSAGE);
    }
    return send(res, 409, `Duplicate value for ${field}`);
  }

  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return send(res, 400, 'Invalid JSON in request body');
  }

  if (err.type === 'entity.too.large') {
    return send(res, 413, 'Request body is too large');
  }

  console.error(err);
  return send(res, 500, 'Internal server error');
}

module.exports = { errorHandler, notFound, DUPLICATE_EMAIL_MESSAGE };
