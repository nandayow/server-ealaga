const mongoose = require('mongoose')

const activitylogsSchema = new mongoose.Schema({
      user_id:{
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
      },
      description: {
          type: String,
      },
      date: {
          type: Date,
          default: Date.now
      },
});

module.exports = mongoose.model('ActivityLogs', activitylogsSchema);