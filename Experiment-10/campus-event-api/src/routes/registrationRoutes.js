const express = require('express');
const {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  updateRegistration,
  deleteRegistration,
} = require('../controllers/registrationController');

const router = express.Router();

router.route('/').post(createRegistration).get(getRegistrations);

router
  .route('/:id')
  .get(getRegistrationById)
  .put(updateRegistration)
  .delete(deleteRegistration);

module.exports = router;
