import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { corsOptions } from './config/cors';
import { requestLogger } from './middlewares/requestLogger.middleware';
import { apiRateLimiter } from './middlewares/rateLimit.middleware';
import { notFoundHandler } from './middlewares/notFound.middleware';
import { errorHandler } from './middlewares/error.middleware';
import routes from './routes/index';

const app = express();

// 1. Helmet setup for setting secure HTTP response headers
app.use(helmet());

// 2. CORS integration
app.use(cors(corsOptions));

// 3. Request Logging middleware
app.use(requestLogger);

// 4. Request size limiting & body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Rate limiting application wide for endpoints under /api
app.use('/api', apiRateLimiter);

// 6. Router registration
app.use('/api', routes);

// 7. Unmatched endpoints fall to notFoundHandler
app.use(notFoundHandler);

// 8. Error catcher handling and formatting response payloads
app.use(errorHandler);

export default app;
