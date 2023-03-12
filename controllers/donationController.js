const Donation = require("../models/donation");
const ActivityLogs = require("../models/activitylogs");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const { google } = require("googleapis");
const CLIENT_ID =
  "245985647212-17ekq9p43o5e2u9iei49tmlhqaqqdouh.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN =
  "1//04sTDhftwMYhLCgYIARAAGAQSNwF-L9Ir2gMbL1h39Mxidzg7hCQCbSAKJ84BVCNX9sGai1j8ojVbIsrfpi2jVjjmf1FqAp8g1Ds";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

/// client Donation

exports.clientDonation = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const donation = await Donation.find({ user_id: id });

  console.log(donation);

  const activitylogs = await ActivityLogs.create({
    user_id: id,
    description: "View the donation",
  });

  res.json({ donation });
});

exports.clientDonationRead = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const donation = await Donation.findById(id);

  const user_idss = req?.user._id;

  const activitylogs = await ActivityLogs.create({
    user_id: user_idss,
    description: "View the specific donation",
  });

  console.log(activitylogs);

  res.json({ donation });
});
