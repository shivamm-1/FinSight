const BusinessProfile = require("../models/BusinessProfile");

async function getBusinessProfile(req, res) {
  try {
    const profile = await BusinessProfile.findOne();

    if (!profile) {
      return res.status(404).json({
        message: "Business profile not found",
      });
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch business profile",
    });
  }
}

async function createBusinessProfile(req, res) {
  try {
    const existingProfile = await BusinessProfile.findOne();

    if (existingProfile) {
      return res.status(409).json({
        message: "Business profile already exists",
      });
    }

    const profile = await BusinessProfile.create(req.body);

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create business profile",
    });
  }
}

async function updateBusinessProfile(req, res) {
  try {
    const profile = await BusinessProfile.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!profile) {
      return res.status(404).json({
        message: "Business profile not found",
      });
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update business profile",
    });
  }
}

module.exports = {
  getBusinessProfile,
  createBusinessProfile,
  updateBusinessProfile,
};
