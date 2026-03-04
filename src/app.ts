import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

import { env, isProduction } from '@/config/env.config';

//MIDDLEWARE
import { requestIdMiddleware, requestLoggerMiddleware } from '@/shared/middleware/requestLogger.middleware';
import { sessionMiddleware } from '@/shared/middleware/session.middleware';
import { generalRateLimiterMiddleware } from '@/shared/middleware/ratelimit.middleware';

//ROUTES
import authRoutes from '@/core/auth/auth.route';
//import userRoutes from './modules/user/user.routes';



const app: Application = express();



/**
 * SECURITY MIDDLEWARE
 * - helmet: Sets various HTTP headers to help protect the app from well-known web vulnerabilities.
 * - cors: Enables Cross-Origin Resource Sharing, allowing the server to specify who can access its resources.
 */

app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false, // Disable CSP in development for easier debugging
    crossOriginResourcePolicy: { policy: 'same-site' }, // Prevents the browser from loading resources from different origins
}));

app.use(cors({
    origin: [env.FRONTEND_URL, env.APP_URL].filter(Boolean), // Allow requests from frontend and backend URLs defined in env
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));




/**
 * REQUEST PARSING MIDDLEWARE
 * - express.json(): Parses incoming requests with JSON payloads and is based on body-parser.
 * - express.urlencoded(): Parses incoming requests with URL-encoded payloads. Extended option allows for rich objects and arrays to be encoded into the URL-encoded format.
 * - compression: Compresses response bodies for all requests that traverse through the middleware, improving performance by reducing the size of the response body.
 * - app.set('trust proxy', 1): This tells Express to trust the first proxy in front of it (like a load balancer), which allows req.ip to correctly identify the client's IP address instead of the proxy's IP. This is important for accurate logging and rate limiting based on client IP.
 */

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.set('trust proxy', 1); // Trust first proxy, enables req.ip to resolve correctly




/**
 * LOGGING & TRACKING MIDDLEWARE
 * - requestIdMiddleware: Assigns a unique ID to each incoming request for better traceability in logs.
 * - requestLoggerMiddleware: Logs details about each incoming request, such as method, URL, status code, and response time.
 */

app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);




/**
 * SESSION MIDDLEWARE
 */

app.use(sessionMiddleware);




/**
 * RATE LIMITING MIDDLEWARE
 */

//General rate limiter for all routes
app.use(generalRateLimiterMiddleware);




/**
 * API ROUTES
 */

app.use('/api/auth', authRoutes);
//app.use('/api/users', userRoutes);




/**
 * ERROR HANDLING MIDDLEWARE
 * Must be defined after all other app.use() and routes calls to catch errors from them.
 */

//app.use(notFoundHandler);
//app.use(errorHandler);




export default app;