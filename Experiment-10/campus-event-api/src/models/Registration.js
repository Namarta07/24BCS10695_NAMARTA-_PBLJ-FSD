const mongoose = require('mongoose');
const { VALID_DISCOUNT_CODES } = require('../utils/discount');

const EVENT_TYPES = ['CODING_HACKATHON', 'AI_WORKSHOP', 'ROBOTICS', 'GAMING'];
const STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'];

// Ends with .edu or .ac.in (value is already lowercased by the setter)
const COLLEGE_EMAIL_REGEX = /^[a-z0-9._%+-]+@(?:[a-z0-9-]+\.)+(?:edu|ac\.in)$/;
const ROLL_NUMBER_REGEX = /^[A-Z0-9]+$/;


function resolveEventType(ctx) {
  if (ctx && typeof ctx.getUpdate === 'function') {
    const update = ctx.getUpdate() || {};
    return (update.$set && update.$set.eventType) || update.eventType;
  }
  return ctx && ctx.eventType;
}

const registrationSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: [true, 'studentName is required'],
      trim: true,
      minlength: [3, 'studentName must be at least 3 characters long'],
      maxlength: [50, 'studentName cannot be longer than 50 characters'],
    },

    collegeEmail: {
      type: String,
      required: [true, 'collegeEmail is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [COLLEGE_EMAIL_REGEX, 'Must be a valid college email ending in .edu or .ac.in'],
    },

    rollNumber: {
      type: String,
      required: [true, 'rollNumber is required'],
      trim: true,
      uppercase: true,
      minlength: [8, 'rollNumber must be between 8 and 10 characters long'],
      maxlength: [10, 'rollNumber must be between 8 and 10 characters long'],
      match: [ROLL_NUMBER_REGEX, 'rollNumber can contain only letters and digits'],
    },

    eventType: {
      type: String,
      required: [true, 'eventType is required'],
      enum: {
        values: EVENT_TYPES,
        message: `eventType must be one of: ${EVENT_TYPES.join(', ')}`,
      },
    },

    teamSize: {
      type: Number,
      required: [true, 'teamSize is required'],
      min: [1, 'teamSize must be at least 1'],
      max: [4, 'teamSize cannot be more than 4'],
      validate: [
        {
          validator: Number.isInteger,
          message: 'teamSize must be a whole number',
        },
        {
          validator: function (value) {
            return !(resolveEventType(this) === 'AI_WORKSHOP' && value > 1);
          },
          message: 'AI Workshop only permits individual registrations',
        },
      ],
    },

    ticketPrice: {
      type: Number,
      required: [true, 'ticketPrice is required'],
      min: [0, 'ticketPrice cannot be negative'],
    },

    discountCode: {
      type: String,
      trim: true,
      uppercase: true,
      validate: {
        validator: (value) => !value || VALID_DISCOUNT_CODES.includes(value),
        message: 'Invalid discount code',
      },
    },

    finalAmount: {
      type: Number,
      min: [0, 'finalAmount cannot be negative'],
    },

    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: `status must be one of: ${STATUSES.join(', ')}`,
      },
      default: 'PENDING',
    },

    registrationDate: {
      type: Date,
      default: Date.now,
      validate: {
        validator: (value) => value.getTime() <= Date.now(),
        message: 'registrationDate cannot be a future date',
      },
    },
  },
  { versionKey: false }
);

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
module.exports.EVENT_TYPES = EVENT_TYPES;
module.exports.STATUSES = STATUSES;
