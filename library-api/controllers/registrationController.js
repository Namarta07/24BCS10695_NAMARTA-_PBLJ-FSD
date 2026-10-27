
const Registration = require("../models/Registration");

const calculateFinalAmount = (ticketPrice, discountCode) => {
    if (!discountCode) return ticketPrice;

    if (discountCode === "CAMPUS50") {
        return ticketPrice * 0.5;
    }

    if (discountCode === "EARLYBIRD") {
        return Math.max(0, ticketPrice - 100);
    }

    throw new Error("Invalid discount code");
};

const validateBusinessRules = (data) => {
    if (
        data.eventType === "AI_WORKSHOP" &&
        data.teamSize !== 1
    ) {
        return "AI Workshop only permits individual registrations";
    }

    if (
        data.discountCode &&
        !["CAMPUS50", "EARLYBIRD"].includes(data.discountCode)
    ) {
        return "Invalid discount code";
    }

    return null;
};

exports.createRegistration = async (req, res, next) => {
    try {
        const data = { ...req.body };

        if (data.discountCode) {
            data.discountCode = data.discountCode.trim().toUpperCase();
        }

        const businessError = validateBusinessRules(data);

        if (businessError) {
            return res.status(400).json({
                success: false,
                message: businessError
            });
        }

        data.finalAmount = calculateFinalAmount(
            data.ticketPrice,
            data.discountCode
        );

        const registration = await Registration.create(data);

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            data: registration
        });
    } catch (error) {
        next(error);
    }
};

exports.getRegistrations = async (req, res, next) => {
    try {
        const filter = {};

        if (req.query.eventType) {
            filter.eventType = req.query.eventType;
        }

        if (req.query.status) {
            filter.status = req.query.status;
        }

        const registrations = await Registration.find(filter);

        return res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        next(error);
    }
};

exports.getRegistrationById = async (req, res, next) => {
    try {
        const registration = await Registration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: registration
        });
    } catch (error) {
        next(error);
    }
};

exports.updateRegistration = async (req, res, next) => {
    try {
        const registration = await Registration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        const data = {
            ...registration.toObject(),
            ...req.body
        };

        if (data.discountCode) {
            data.discountCode = data.discountCode.trim().toUpperCase();
        }

        const businessError = validateBusinessRules(data);

        if (businessError) {
            return res.status(400).json({
                success: false,
                message: businessError
            });
        }

        data.finalAmount = calculateFinalAmount(
            data.ticketPrice,
            data.discountCode
        );

        registration.set(data);
        await registration.save();

        return res.status(200).json({
            success: true,
            message: "Registration updated successfully",
            data: registration
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteRegistration = async (req, res, next) => {
    try {
        const registration = await Registration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        registration.status = "CANCELLED";
        await registration.save();

        return res.status(200).json({
            success: true,
            message: "Registration cancelled successfully",
            data: registration
        });
    } catch (error) {
        next(error);
    }
};
