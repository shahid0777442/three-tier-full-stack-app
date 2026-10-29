const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [140, 'Title must be 140 characters or fewer'],
    },
    priority: {
      type: String,
      enum: { values: ['low', 'medium', 'high'], message: 'Priority must be low, medium or high' },
      default: 'medium',
    },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
