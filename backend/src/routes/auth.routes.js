import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { buildErrorPayload, VALIDATION_CODE_MAP } from '../utils/errorCodes.js';
import passport from 'passport';
import { requestOTP, verifyOTPController, me, updateProfileBasics } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Specific OTP rate limits (relaxed dramatically in test env to reduce flakiness)
const isTest = (process.env.NODE_ENV || '').toLowerCase() === 'test';
const otpRequestLimiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	max: isTest ? 500 : 5,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		return res.status(429).json(buildErrorPayload({
			error: 'RATE_LIMIT',
			message: VALIDATION_CODE_MAP.RATE_LIMIT_OTP_REQUEST.message,
			status: 429,
			requestId: req.requestId,
			details: [VALIDATION_CODE_MAP.RATE_LIMIT_OTP_REQUEST]
		}));
	}
});
const otpVerifyLimiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	max: isTest ? 1000 : 10,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		return res.status(429).json(buildErrorPayload({
			error: 'RATE_LIMIT',
			message: VALIDATION_CODE_MAP.RATE_LIMIT_OTP_VERIFY.message,
			status: 429,
			requestId: req.requestId,
			details: [VALIDATION_CODE_MAP.RATE_LIMIT_OTP_VERIFY]
		}));
	}
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
