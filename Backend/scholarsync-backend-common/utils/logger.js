import winston from 'winston';

const { combine, timestamp, errors } = winston.format;

const replacerFunction = () => {
  const visited = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (visited.has(value)) {
        return;
      }

      visited.add(value);
    }

    return value;
  };
};

const myFormat = winston.format.printf((info) =>
  typeof info.message === 'object'
    ? JSON.stringify({
        ...info.message,
        level: info.level,
        timestamp: info.timestamp,
        error: info.error?.message || info.error || undefined,
      })
    : JSON.stringify(info, replacerFunction())
);

const logger = winston.createLogger({
  level: 'debug',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    myFormat
  ),
  transports: [
    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: true,
      colorize: true,
    }),
  ],
  exitOnError: false,
});

export default logger;
