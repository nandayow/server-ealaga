const mongoose = require('mongoose')

const healthSchema = new mongoose.Schema({
    health_problem: {
        type: String,
        required: [true, 'Please provide health problem name'],
        trim: true,
        maxLength: [50, 'Disease name cannot exceed 50 characters']
    },
    description: {
        type: String,
        required: [true, 'Please provide description'],
    },
});

module.exports = mongoose.model('Health', healthSchema);