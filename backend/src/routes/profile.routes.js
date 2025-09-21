import { Router } from 'express';
import { addMember, listMembers } from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.post('/members', addMember);
router.get('/members', listMembers);
export default router;
