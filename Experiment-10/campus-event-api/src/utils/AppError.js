class AppError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors || [message];
    this.isOperational = true;
  }
}

module.exports = AppError;
