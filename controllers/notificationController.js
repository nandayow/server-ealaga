const Notification = require("../models/notification");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const User = require("../models/user");
const Log = require("../models/log");
const Schedule = require("../models/schedule");
const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Singapore");
const ActivityLogs = require("../models/activitylogs");

exports.allNotification = catchAsyncErrors(async (req, res, next) => {
  // const user_id = req?.User._id
  const { user_id } = req.body;
  // const user_id  = "63c847b6766b86e98c087b64";
  const notification = await Notification.find({ user_id: user_id });

  const now = moment().startOf("day"); // current date without time components
  const tomorrow = moment().endOf("day").add(1, "day"); // tomorrow's date without time components

  const schedules = await Schedule.find({
    date_schedule: { $gte: now.toDate(), $lt: tomorrow.toDate() },
  });

  for (const schedule of schedules) {
    let description = "";
    let notifToday = false;
    let notifTomorrow = false;

    if (schedule.date_schedule.getDate() === now.date()) {
      description = `We are informing you that you have a schedule today (${moment(
        schedule.date_schedule
      ).format("MMMM DD, YYYY")}) for ${schedule.category}.`;
      notifToday = true;
    } else if (schedule.date_schedule.getDate() === tomorrow.date()) {
      description = `We are informing you that you have a schedule tomorrow (${moment(
        schedule.date_schedule
      ).format("MMMM DD, YYYY")}) for ${schedule.category}.`;
      notifTomorrow = true;
    }

    // Check if the schedule already has notification for today and tomorrow
    if (!schedule.notif_today && notifToday) {
      // Create notification for today
      await Notification.create({
        user_id: schedule.user_id,
        type: "Schedule Reminder",
        description: description,
      });
      // Update schedule's notif_today field to true
      await Schedule.updateOne(
        { _id: schedule._id },
        { $set: { notif_today: true } }
      );
    }

    if (!schedule.notif_tomorrow && notifTomorrow) {
      // Create notification for tomorrow
      await Notification.create({
        user_id: schedule.user_id,
        type: "Schedule Reminder",
        description: description,
      });
      // Update schedule's notif_tomorrow field to true
      await Schedule.updateOne(
        { _id: schedule._id },
        { $set: { notif_tomorrow: true } }
      );
    }
  }

  const all_read = await Notification.find({
    user_id: user_id,
    all_read: false,
  });

  const total_notif = all_read.length;

  res.json({ notification, total_notif });
});

exports.updateLength = catchAsyncErrors(async (req, res, next) => {
  const user_id = req?.user._id;

  const updatedNotifications = await Notification.updateMany(
    { user_id }, // Query to find notifications with matching user_id
    { all_read: true } // Update to set all_read to true
  );

  res.json({ updatedNotifications });
});

exports.updateSpecificNotif = catchAsyncErrors(async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { specific_read: true },
      {
        new: true,
        runValidators: true,
        useFindandModify: false,
      }
    );

    // console.log(notification)

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (err) {
    res.status(400).json({
      message: "Notif not found",
    });
  }
});

exports.newNotification = catchAsyncErrors(async (req, res, next) => {
  const { user_id, type, description } = req.body;

  const newNotificationData = {
    user_id: user_id,
    type: type,
    description: description,
  };
  // console.log(newNotificationData);

  const notification = await Notification.create(newNotificationData);

  const user_ids = req?.user._id;

  const activitylogs = await ActivityLogs.create({
    user_id: user_ids,
    description: "Send a notification to user",
  });

  await Log.create({
    date: new Date(),
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    responseTime: Date.now() - req._startTime,
    referrer: req.headers.referer || "",
    userAgent: req.headers["user-agent"] || "",
    platform: "web",
  });

  // console.log(activitylogs)

  res.status(201).json({
    success: true,
    notification,
  });
});
