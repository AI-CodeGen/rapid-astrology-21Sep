export function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
}

import mongoose from 'mongoose';
import { buildValidationPayload, mapMongooseValidator, mapMongoServerError, buildErrorPayload } from '../utils/errorCodes.js';

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Mongoose duplicate key or validation errors -> 400
  if (err instanceof mongoose.Error.ValidationError) {
    const mapped = [];
    for (const [path, detail] of Object.entries(err.errors)) {
      mapped.push(mapMongooseValidator(path, detail.kind, detail.value, detail.properties));
    }
    return res.status(400).json(buildErrorPayload({ error: 'VALIDATION_ERROR', message: 'Validation failed', status: 400, requestId: req.requestId, user: req.user, details: buildValidationPayload({ errors: mapped }).details }));
  }
  const dup = mapMongoServerError(err);
  if (dup) {
    return res.status(409).json(buildErrorPayload({ error: 'VALIDATION_ERROR', message: 'Duplicate key', status: 409, requestId: req.requestId, user: req.user, details: [dup] }));
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json(buildErrorPayload({
    error: 'SERVER_ERROR',
    message: err.message || 'Server Error',
    status: statusCode,
    requestId: req.requestId,
    user: req.user,
    details: undefined
  }));
}
