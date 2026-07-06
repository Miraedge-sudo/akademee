const morgan = require('morgan');
const logger = require('../utils/logger');

const stream = {
  write: (message) => logger.http(message.trim()),
};

const skip = () => {
  return process.env.NODE_ENV === 'test';
};

morgan.token('req-id', (req) => req.reqId || '-');
morgan.token('user-id', (req) => (req.user ? req.user.userId || req.user.id : '-'));

const httpLogger = morgan(
  ':req-id :remote-addr :method :url :status :res[content-length] - :response-time ms :user-id',
  { stream, skip },
);

module.exports = httpLogger;
