const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
      user_id:{
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
      },
      type:{
        type: String,
      },
      description: {
          type: String,
      },
      all_read: {
        type: Boolean,
        required: true,
        default: false
      },
      specific_read: {
        type: Boolean,
        required: true,
        default: false
      },
      date: {
          type: Date,
          default: Date.now
      },
});

module.exports = mongoose.model('Notification', notificationSchema);