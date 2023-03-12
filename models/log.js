const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  date: Date,
  method: String,
  url: String,
  status: Number,
  responseTime: Number,
  referrer: String,
  userAgent: String,
  platform:String, //web or mobile value
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
