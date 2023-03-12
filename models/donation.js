const mongoose = require('mongoose')

const donationSchema = new mongoose.Schema({
    donator_name: {
        type: String,
        required: [true, 'Please provide donator_name'],
        trim: true,
        maxLength: [50, 'Disease name cannot exceed 50 characters']
    },
    category: {
        type: String,
        required: [true, 'Please provide category'],
        trim: true,
        maxLength: [50, 'Disease name cannot exceed 50 characters']
    },
    quantity: {
        type: Number,
        required: [true, 'Please provide quantity'],
    },
    user_id:{
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
    },
    processed_by:{
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
    },
    image: {
        public_id: {
            type: String,
           
        },
        url: {
            type: String,
         
        }
    },
    donatedAt: {
        type: Date,
        default: Date.now
    }


});

module.exports = mongoose.model('Donation', donationSchema);