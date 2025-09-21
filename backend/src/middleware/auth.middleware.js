import User from '../models/User.js';
import { verifyToken } from '../services/jwt.service.js';
import { serializeUser } from '../utils/serializeUser.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing auth header' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Invalid auth header' });
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.uid);
    if (!user) return res.status(401).json({ message: 'User not found' });
  // Attach serialized safe user object
  req.user = serializeUser(user);
    req.dbUser = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
