const mongoose = require("mongoose");
const BusinessProfile = require("../models/BusinessProfile.js");

async function getBusinessProfile(req, res) {
  try {
    const businessProfile = await BusinessProfile.findOne({
      owner: req.user.id,
    });

    if (!businessProfile) {
      return res.status(404).json({
        message: "No business profile found for this account",
      });
    }

    return res.status(200).json({
      message: "Business profile retrieved successfully",
      data: businessProfile,
    });
  } catch (error) {
    console.error("Get business profile error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve business profile",
    });
  }
}

async function createBusinessProfile(req, res) {
  try {
    const existingProfile = await BusinessProfile.findOne({
      owner: req.user.id,
    });

    if (existingProfile) {
      return res.status(409).json({
        message: "You already have a business profile",
      });
    }

    const businessProfile = await BusinessProfile.create({
      ...req.body,
      owner: req.user.id,
    });

    return res.status(201).json({
      message: "Business profile created successfully",
      data: businessProfile,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A business profile already exists for this account",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Business profile validation failed",
      });
    }

    console.error("Create business profile error:", error.message);

    return res.status(500).json({
      message: "Unable to create business profile",
    });
  }
}

async function updateBusinessProfile(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid business profile ID",
      });
    }

    const businessProfile = await BusinessProfile.findOneAndUpdate(
      {
        _id: id,
        owner: req.user.id,
      },
      {
        $set: req.body,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!businessProfile) {
      return res.status(404).json({
        message: "Business profile not found for this account",
      });
    }

    return res.status(200).json({
      message: "Business profile updated successfully",
      data: businessProfile,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Business profile validation failed",
      });
    }

    console.error("Update business profile error:", error.message);

    return res.status(500).json({
      message: "Unable to update business profile",
    });
  }
}

module.exports = {
  getBusinessProfile,
  createBusinessProfile,
  updateBusinessProfile,
};
