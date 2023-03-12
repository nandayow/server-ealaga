const mongoose = require('mongoose')
const validator = require('validator');

const applicantSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: [true, 'Please enter your first name'],
        maxLength: [15, 'Your name cannot exceed 30 characters']
    },
    middle_name: {
        type: String,
        required: [true, 'Please enter your middle name'],
        maxLength: [15, 'Your name cannot exceed 30 characters']
    },
    last_name: {
        type: String,
        required: [true, 'Please enter your last name'],
        maxLength: [15, 'Your name cannot exceed 30 characters']
    },
    contact_number: {
        type: Number,
        required: [true, 'Please enter your contact number'],
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        validate: [validator.isEmail, 'Please enter valid email address']
    },
    position: {
        type: String,
        // enum: {
        //     values: [
        //         'admin',
        //         'personnel',
        //         'client',
        //     ],
        //     message: 'Please select correct role for user'
        // }
    },
    status: {
        type: String,
        enum: {
            values: [
                'denied',
                'pending',
                'accepted'
            ],
            message: 'Please select status for applicant'
        },
        default: "pending"
    },
    document: {
        public_id: {
            type: String,
           
        },
        url: {
            type: String,
         
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },

});

module.exports = mongoose.model('Applicant', applicantSchema);