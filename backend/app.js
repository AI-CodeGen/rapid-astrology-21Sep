// Rapid Astrology Backend Entry Point
import express from 'express';
import { randomUUID } from 'crypto';
import client from 'prom-client';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import mongoose from 'mongoose';
import morgan from 'morgan';

// Routes (to be implemented)
import authRoutes from './src/routes/auth.routes.js';
import passport from 'passport';
import './src/services/passport.service.js';
import profileRoutes from './src/routes/profile.routes.js';
import predictionRoutes from './src/routes/prediction.routes.js';
import paymentRoutes from './src/routes/payment.routes.js';
import reportRoutes from './src/routes/report.routes.js';
import otpConfig from './src/config/otp.config.js';
import { initRedis } from './src/services/redis.service.js';

import { notFound, errorHandler } from './src/middleware/error.middleware.js';
import { buildSuccessPayload } from './src/utils/errorCodes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// --- Database Connection ---
async function connectDB() {
	// In test mode we let tests control the in-memory Mongo connection (mongodb-memory-server)
	if ((process.env.NODE_ENV || '').toLowerCase() === 'test') {
		console.log('Skipping automatic Mongo connect in test environment');
		return;
	}
	const primary = process.env.MONGO_URI;
	if (!primary) {
		console.error('MONGO_URI not set');
		process.exit(1);
	}
	const fallback = primary.includes('mongo:27017') ? primary.replace('mongo:27017','localhost:27017') : null;
	for (const attemptUri of [primary, fallback]) {
		if (!attemptUri) continue;
		try {
			await mongoose.connect(attemptUri, { autoIndex: true, serverSelectionTimeoutMS: 4000 });
			console.log('MongoDB connected:', attemptUri);
			return;
		} catch (err) {
			console.error('Mongo connection attempt failed for', attemptUri, err.message);
		}
	}
	console.error('All Mongo connection attempts failed. Exiting.');
	process.exit(1);
}
connectDB();
if (process.env.NODE_ENV === 'test') {
  console.log('Skipping Redis init in test environment');
} else {
  initRedis().catch(e => console.error('Redis init failed', e.message));
}

// --- Middleware ---
app.use(helmet({
	crossOriginResourcePolicy: { policy: 'cross-origin' },
	contentSecurityPolicy: {
		useDefaults: true,
		directives: {
			defaultSrc: ["'self'"],
			baseUri: ["'self'"],
			styleSrc: ["'self'","'unsafe-inline'","https:"],
			connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173']
		}
	}
}));
app.use(cors({ origin: process.env.FRONTEND_URL?.split(',') || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(hpp());
app.use(morgan('dev'));
app.use(passport.initialize());

// Correlation / Request ID middleware
app.use((req, res, next) => {
	const reqId = req.headers['x-request-id'] || randomUUID();
	req.requestId = reqId;
	res.setHeader('x-request-id', reqId);
	next();
});

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 300,
	standardHeaders: true,
	legacyHeaders: false
});
app.use('/api', limiter);

// --- Health Check ---
app.get('/health', (_req, res) => {
	// Maintain legacy shape: original tests expected { status: 'ok', time: <iso> }
	// New standardized envelope provides timestamp; we alias it to time for backward compatibility
	const payload = buildSuccessPayload({ data: { status: 'ok' }, requestId: _req.requestId, message: 'health' });
	payload.time = payload.timestamp; // legacy field
	res.json(payload);
});

// Prometheus metrics setup
const register = client.register;
client.collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
	try {
		res.set('Content-Type', register.contentType);
		const metrics = await register.metrics();
		res.send(metrics); // plain text
	} catch (e) {
		res.status(500).json(buildSuccessPayload({ data: { error: e.message }, requestId: req.requestId, message: 'metrics_error' }));
	}
});

// JSON line logging middleware (after requestId so it can be used)
app.use((req, res, next) => {
	const start = process.hrtime.bigint();
	res.on('finish', () => {
		const diffMs = Number(process.hrtime.bigint() - start) / 1e6;
		const logEntry = {
			requestId: req.requestId,
			method: req.method,
			url: req.originalUrl,
			status: res.statusCode,
			ms: +diffMs.toFixed(2),
			userId: req.user?.id || null,
			roles: req.user?.roles || undefined,
			ts: new Date().toISOString()
		};
		// eslint-disable-next-line no-console
		console.log(JSON.stringify(logEntry));
	});
	next();
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// 404 & Error handlers
app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
	app.listen(PORT, () => {
		console.log(`Rapid Astrology backend running on port ${PORT}`);
	});
}

export default app;
