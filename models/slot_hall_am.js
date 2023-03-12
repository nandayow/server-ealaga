const mongoose = require('mongoose');

const dateSchema = new mongoose.Schema({
    date: {
        type: String,
    },
    avaliableSlot: {
        type: Number,
    },
    totalSlot: {
        type: String,
    },
})


module.exports = mongoose.model('slot_hall_am', dateSchema);