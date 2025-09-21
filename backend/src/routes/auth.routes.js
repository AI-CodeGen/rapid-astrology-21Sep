import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { requestOTP, verifyOTPController, me, updateProfileBasics } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Specific OTP rate limits
const otpRequestLimiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	max: 5,
	message: { message: 'Too many OTP requests, please try later.' }
});
const otpVerifyLimiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	max: 10,
	message: { message: 'Too many OTP verifications, please try later.' }
});

router.post('/otp/request', otpRequestLimiter, requestOTP);
router.post('/otp/verify', otpVerifyLimiter, verifyOTPController);
router.get('/me', authenticate, me);
router.patch('/me', authenticate, updateProfileBasics);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile','email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/?auth=failed' }), (req,res)=> {
	// Issue JWT token
	const { signToken } = require('../services/jwt.service.js'); // CommonJS-like dynamic import in ESM context; alt: import * as
	const token = signToken({ uid: req.user._id, roles: req.user.roles });
	res.redirect((process.env.FRONTEND_URL || 'http://localhost:5173') + '/login?token=' + token);
});

export default router;
