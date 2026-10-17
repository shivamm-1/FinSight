require("dotenv").config();

const mongoose = require("mongoose");
const connectDatabase = require("../src/config/database");
const User = require("../src/models/user.js");
const BusinessProfile = require("../src/models/businessProfile.js");

async function assignBusinessOwner() {
  try {
    const username = "owner_test01";
    const businessProfileId = "6ac11762fa03fb286ecdb873";

    await connectDatabase();

    const user = await User.findOne({ username });

    if (!user) {
      throw new Error(`User "${username}" was not found`);
    }

    if (user.role !== "business_owner") {
      throw new Error("The selected account is not a business owner");
    }

    const businessProfile = await BusinessProfile.findById(businessProfileId);

    if (!businessProfile) {
      throw new Error("The specified business profile was not found");
    }

    if (businessProfile.owner) {
      if (businessProfile.owner.toString() === user._id.toString()) {
        console.log("This business profile already belongs to the user.");
        return;
      }

      throw new Error(
        "This business profile already belongs to another user. No changes were made.",
      );
    }

    const existingProfile = await BusinessProfile.findOne({
      owner: user._id,
    });

    if (existingProfile) {
      throw new Error(
        "This user already has a business profile. No changes were made.",
      );
    }

    businessProfile.owner = user._id;
    await businessProfile.save();

    console.log("Business profile ownership assigned successfully.");
    console.log(`Username: ${user.username}`);
    console.log(`Business: ${businessProfile.businessName}`);
    console.log(`Profile ID: ${businessProfile._id}`);
    console.log(
      "Existing financial transactions remain linked to this profile.",
    );
  } catch (error) {
    console.error("Ownership migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

assignBusinessOwner();
