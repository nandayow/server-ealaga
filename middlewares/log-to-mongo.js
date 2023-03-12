const Log = require('../models/log');

const logToMongo = (req, res, next) => {
  const log = new Log({
    date: new Date(),
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    responseTime: Date.now() - req._startTime,
    referrer: req.headers.referer || '',
    userAgent: req.headers['user-agent'] || '',
    platform:"mobile",
  });

  log.save()
    .then(() => console.log('Log saved to MongoDB'))
    .catch((err) => console.log('Error saving log to MongoDB: ', err));

  next();
};

module.exports = logToMongo;
