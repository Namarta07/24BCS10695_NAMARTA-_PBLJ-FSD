const express = require("express");

const {
    createRegistration,
    getRegistrations,
    getRegistrationById,
    updateRegistration,
    deleteRegistration
} = require("../controllers/registrationController");

const router = express.Router();

router.post("/", createRegistration);
router.get("/", getRegistrations);
router.get("/:id", getRegistrationById);
router.put("/:id", updateRegistration);
router.delete("/:id", deleteRegistration);

module.exports = router;