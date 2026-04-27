import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import reportRoutes from './api/routes/routes.js';
import { ROUTES } from './constants/route-constants.js';
import { initiateMiddleware } from 'scholarsync-backend-common';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swaggerDocument = JSON.parse(fs.readFileSync(path.resolve(__dirname, './api/swagger.json'), 'utf8'));

const app = express();

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

app.use(initiateMiddleware({ service: 'REPORT' }));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'ScholarSync Report Service is running' });
});

app.use(ROUTES.BASE_ROUTE + ROUTES.SWAGGER_ROUTE, swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));
app.use(ROUTES.BASE_ROUTE, reportRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

export default app;
