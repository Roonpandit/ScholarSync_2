import dotenv from 'dotenv';
dotenv.config();

import { connectPG } from 'scholarsync-backend-common';

const start = async () => {
  try {
    await connectPG();

    const { ROUTES } = await import('./constants/route-constants.js');
    const { default: app } = await import('./index.js');
    const { updateSlotStatuses, autoCloseExpiredLeaveRequests } = await import('./config/cron.js');
    const { scheduleMarkAbsent } = await import('./config/markAbsentCron.js');

    // Start cron jobs
    updateSlotStatuses();
    autoCloseExpiredLeaveRequests();
    scheduleMarkAbsent();

    const PORT = process.env.PORT || 6002;

    const server = app.listen(PORT, () => {
      console.log(`WFMS Service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
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
    console.error('Failed to start WFMS Service:', err);
    process.exit(1);
  }
};

start();
