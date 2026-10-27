const Registration = require('../models/Registration');
const { EVENT_TYPES, STATUSES } = require('../models/Registration');
const AppError = require('../utils/AppError');
const { calculateFinalAmount } = require('../utils/discount');

const WRITABLE_FIELDS = [
  'studentName',
  'collegeEmail',
  'rollNumber',
  'eventType',
  'teamSize',
  'ticketPrice',
  'discountCode',
  'status',
  'registrationDate',
];

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function pick(source, fields) {
  const result = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      result[field] = source[field];
    }
  }
  return result;
}

function getBody(req) {
  const body = req.body;
  if (body === undefined || body === null) return {};
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'Request body must be a JSON object');
  }
  return body;
}


function assertValidId(id) {
  if (!OBJECT_ID_REGEX.test(id)) {
    throw new AppError(400, 'Invalid registration ID format');
  }
}

const createRegistration = asyncHandler(async (req, res) => {
  const payload = pick(getBody(req), WRITABLE_FIELDS);

  const { code, finalAmount } = calculateFinalAmount(payload.ticketPrice, payload.discountCode);
  if (code) {
    payload.discountCode = code;
  } else {
    delete payload.discountCode;
  }
  if (finalAmount !== undefined) payload.finalAmount = finalAmount;

  const registration = await Registration.create(payload);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: registration,
  });
});

const getRegistrations = asyncHandler(async (req, res) => {
  const { eventType, status } = req.query;
  const filter = {};

  if (eventType !== undefined) {
    if (typeof eventType !== 'string' || !EVENT_TYPES.includes(eventType.toUpperCase())) {
      throw new AppError(400, `eventType filter must be one of: ${EVENT_TYPES.join(', ')}`);
    }
    filter.eventType = eventType.toUpperCase();
  }

  if (status !== undefined) {
    if (typeof status !== 'string' || !STATUSES.includes(status.toUpperCase())) {
      throw new AppError(400, `status filter must be one of: ${STATUSES.join(', ')}`);
    }
    filter.status = status.toUpperCase();
  }

  const registrations = await Registration.find(filter).sort({ registrationDate: -1 });

  res.status(200).json({
    success: true,
    count: registrations.length,
    data: registrations,
  });
});

const getRegistrationById = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);

  const registration = await Registration.findById(req.params.id);
  if (!registration) throw new AppError(404, 'Registration not found');

  res.status(200).json({ success: true, data: registration });
});

const updateRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertValidId(id);

  const changes = pick(getBody(req), WRITABLE_FIELDS);
  if (Object.keys(changes).length === 0) {
    throw new AppError(400, 'No valid fields provided for update');
  }

  const existing = await Registration.findById(id).lean();
  if (!existing) throw new AppError(404, 'Registration not found');

 
  const merged = { ...pick(existing, WRITABLE_FIELDS), ...changes };

  const { code, finalAmount } = calculateFinalAmount(merged.ticketPrice, merged.discountCode);

  const $set = { ...merged };
  const update = { $set };

  if (code) {
    $set.discountCode = code;
  } else {
    delete $set.discountCode;
    update.$unset = { discountCode: 1 };
  }
  if (finalAmount !== undefined) $set.finalAmount = finalAmount;

  const updated = await Registration.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
    context: 'query',
  });

  if (!updated) throw new AppError(404, 'Registration not found');

  res.status(200).json({
    success: true,
    message: 'Registration updated successfully',
    data: updated,
  });
});

const deleteRegistration = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);

  const deleted = await Registration.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError(404, 'Registration not found');

  res.status(200).json({
    success: true,
    message: 'Registration cancelled successfully',
    data: deleted,
  });
});

module.exports = {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  updateRegistration,
  deleteRegistration,
};
