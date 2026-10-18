// Express gives us tools to handle web requests (GET, POST, PUT, etc.)
const express = require("express");

// Router lets us group all profile-related links together in one file
const router = express.Router();

// authGuard is our security bouncer: it checks if the user has a valid login token
const authGuard = require("../middleware/authGuard");

// Import the database functions we created in profileService.js
const { getProfileByUserId, updateMyProfile } = require("../services/profileService");

//
 // 1. VIEW A PROFILE
 // Method: GET
 //URL: /api/profiles/:userId
 //
 //Example: /api/profiles/123e4567-e89b-12d3-a456-426614174000
 //What it does: Allows any logged-in user to see a student's public profile and skills.
 
router.get("/:userId", authGuard, async (req, res) => {
  try {
    // Grab the student ID from the URL path (:userId)
    const { userId } = req.params;

    // Ask our service to fetch the profile and skills from PostgreSQL
    const profile = await getProfileByUserId(userId);

    // If no record comes back, tell the frontend "Not Found" (404)
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Profile not found.",
      });
    }

    // Success: return the profile data with a 200 OK status
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    // If the database has a hiccup, catch it and return a 500 server error
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve profile.",
    });
  }
});


 // 2. EDIT YOUR OWN PROFILE
 //Method: PUT
 // URL: /api/profiles/me
 
 // What it does: Lets an authenticated student save changes to their OWN profile.
 //Security rule: They cannot edit anyone else because the ID comes directly
 //from their verified login token (req.user.id), not from the URL.
 
router.put("/me", authGuard, async (req, res) => {
  try {
    // Grab the ID of the person currently logged in (set securely by authGuard)
    const myUserId = req.user.id;

    // req.body contains the fields they typed (displayName, bio, interests, availability)
    const updatedProfile = await updateMyProfile(myUserId, req.body);

    // Success: return the updated profile with 200 OK
    return res.status(200).json({
      success: true,
      data: updatedProfile,
    });
  } catch (error) {
    // If validation fails (e.g. negative hours or blank name),
    // send back a 400 Bad Request error with the message
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to update profile.",
    });
  }
});

// Export the router so backend/src/app.js can connect it to the server
module.exports = router;