import User from '../models/User.js';
import { verifyToken } from '../services/jwt.service.js';
import { serializeUser } from '../utils/serializeUser.js';
import { buildErrorPayload, VALIDATION_CODE_MAP } from '../utils/errorCodes.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json(buildErrorPayload({ error: 'AUTH_ERROR', message: 'Missing auth header', status: 401, requestId: req.requestId, details: [VALIDATION_CODE_MAP.AUTH_MISSING] }));
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json(buildErrorPayload({ error: 'AUTH_ERROR', message: 'Invalid auth header', status: 401, requestId: req.requestId, details: [VALIDATION_CODE_MAP.AUTH_INVALID] }));
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.uid);
    if (!user) return res.status(401).json(buildErrorPayload({ error: 'AUTH_ERROR', message: 'User not found', status: 401, requestId: req.requestId, details: [VALIDATION_CODE_MAP.AUTH_USER_NOT_FOUND] }));
  // Attach serialized safe user object
  req.user = serializeUser(user);
    req.dbUser = user;
    next();
  } catch (e) {
    return res.status(401).json(buildErrorPayload({ error: 'AUTH_ERROR', message: 'Invalid token', status: 401, requestId: req.requestId, details: [VALIDATION_CODE_MAP.AUTH_INVALID] }));
  }
}
