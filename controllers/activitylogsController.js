const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const ActivityLogs = require("../models/activitylogs");


exports.allActivityLogs = catchAsyncErrors(async(req,res,next) => {

  // console.log(req.user._id)
  const allActivityLogs = await ActivityLogs.find().populate("user_id");

  // console.log(allActivityLogs)
  res.json({allActivityLogs});

})