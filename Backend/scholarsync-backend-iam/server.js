import dotenv from 'dotenv';
dotenv.config();

import { connectPG } from 'scholarsync-backend-common';

const start = async () => {
  try {
    await connectPG();

    const { ROUTES } = await import('./constants/route-constants.js');
    const { default: app } = await import('./index.js');
    const PORT = process.env.PORT || 6001;

    const server = app.listen(PORT, () => {
      console.log(`IAM Service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`Swagger-ui is available on http://localhost:${PORT}${ROUTES.BASE_ROUTE}${ROUTES.SWAGGER_ROUTE}`);
    });

    process.on('unhandledRejection', (err) => {
      console.log(`Error: ${err.message}`);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error('Failed to start IAM Service:', err);
    process.exit(1);
  }
};

start();
