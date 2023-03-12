const Dateslotlist = require("../models/dateslotlist");
const Slot_recreational_am = require("../models/slot_recreational_am");
const Slot_recreational_pm = require("../models/slot_recreational_pm");
const Slot_hall_am = require("../models/slot_hall_am");
const Slot_hall_pm = require("../models/slot_hall_pm");
const Slot_dialysis_am = require("../models/slot_dialysis_am");
const Slot_dialysis_pm = require("../models/slot_dialysis_pm");
const ActivityLogs = require("../models/activitylogs");
const Schedule = require("../models/schedule");
const qr = require("qrcode");
const cloudinary = require("cloudinary");
const moment = require("moment");

exports.schedule = async (req, res) => {
  const { id } = req.params;

  const user = await Schedule.find({ user_id: id });

  // console.log(user);
  const dates = await Dateslotlist.find();
  var date = new Date();
  var yesterdate = new Date(date.setDate(date.getDate() - 1));
  const newSelectedDate = new Date(yesterdate).toLocaleDateString();

  const selectedDate = await Dateslotlist.find({ date: newSelectedDate });

  const selectedSlotDate = await Dateslotlist.find({ avaliableSlot: 0 });

  if (selectedDate != "") {
    const updatedSlot = await Dateslotlist.findByIdAndUpdate(
      selectedDate[0]._id,
      {
        $set: { avaliableSlot: 0, totalSlot: 0 },
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
  }
  var userSched = user.map(function (dates) {
    return dates.date_schedule;
  });
  var disableDate = selectedSlotDate.map(function (dates) {
    return dates.date;
  });
  console.log(userSched);
  // console.log(disableDate);
  return res.status(200).json({
    success: true,
    dates,
    disableDate,
    userSched,
  });
};

exports.history = async (req, res) => {
  const { id } = req.params;

  const user = await Schedule.find({ user_id: id });

  var date = user.map(function (dates) {
    return dates.date_schedule;
  });

  const nowss = moment().format("YYYY-MM-DD");

  const filter = user.filter(
    (user) => moment(user.date_schedule).format("YYYY-MM-DD") < nowss
  );

  const activitylogs = await ActivityLogs.create({
    user_id: id,
    description: "View the history schedule",
  });
  console.log(activitylogs);

  return res.status(200).json({
    success: true,
    filter,
  });
};

exports.activity = async (req, res) => {
  const { id } = req.params;

  const user = await Schedule.find({ user_id: id });

  var date = user.map(function (dates) {
    return dates.date_schedule;
  });

  var now = new Date();

  const nowss = moment().format("YYYY-MM-DD");

  // var todate = new Date(nowss).toISOString()

  // console.log(nowss);

  const filter = user.filter(
    (user) => moment(user.date_schedule).format("YYYY-MM-DD") >= nowss
  );

  const activitylogs = await ActivityLogs.create({
    user_id: id,
    description: "View the present schedule",
  });

  console.log(activitylogs);
  // console.log(filter)
  return res.status(200).json({
    success: true,
    filter,
  });
};

exports.viewActivity = async (req, res) => {
  const { id } = req.params;

  const schedData = await Schedule.find({ _id: id });
  var schedDataQr = schedData.map(function (schedDatas) {
    return schedDatas.qr_code;
  });

  const activitylogs = await ActivityLogs.create({
    user_id: user_idss,
    description: "View the specific schedule",
  });

  return res.status(200).json({
    success: true,
    schedData,
    schedDataQr,
  });
};

exports.addReview = async (req, res) => {
  const { id } = req.params;
  const { rate, comment } = req.body;
  // console.log(rate,comment);
  const schedulesqr = await Schedule.findByIdAndUpdate(
    id,
    {
      review: {
        rate: rate,
        comment: comment,
      },
    },
    {
      new: true,
      runValidators: true,
      useFindandModify: false,
    }
  );

  // const schedData = await Schedule.find({'_id' : id});
  // var schedDataQr = schedData.map(function(schedDatas){return schedDatas.qr_code});
  // var date = schedDataQr.map(function(schedDataQrss){return schedDataQrss.qr_code;});

  // var now = new Date();

  // const filter = schedDataQr.filter();

  // console.log(id)
  return res.status(200).json({
    success: true,
  });
};

exports.cancelActivity = async (req, res) => {
  const { id } = req.params;

  const schedData = await Schedule.findById({ _id: id });

  if (schedData.category == "Recreational Activity") {
    if (schedData.time == "am") {
      const date = schedData.date_schedule;
      var yesterdate = new Date(date.setDate(date.getDate()));
      const dateUpdate = yesterdate.toLocaleDateString();

      const selectedDate = await Slot_recreational_am.find({
        date: dateUpdate,
      });

      const updateSlot = selectedDate[0].avaliableSlot + 1;

      const updatedSlot = await Slot_recreational_am.findByIdAndUpdate(
        selectedDate[0]._id,
        {
          $set: { avaliableSlot: updateSlot },
        },
        {
          new: true,
          runValidators: true,
          useFindAndModify: false,
        }
      );

      // console.log(updateSlot);
      await schedData.remove();
      const user_idss = req?.user._id;

      const activitylogs = await ActivityLogs.create({
        user_id: user_idss,
        description: "Cancel the morning recreational activity schedule",
      });

      return res.status(200).json({
        success: true,
      });
    } else {
      const date = schedData.date_schedule;
      var yesterdate = new Date(date.setDate(date.getDate()));
      const dateUpdate = yesterdate.toLocaleDateString();

      const selectedDate = await Slot_recreational_pm.find({
        date: dateUpdate,
      });

      const updateSlot = selectedDate[0].avaliableSlot + 1;

      const updatedSlot = await Slot_recreational_pm.findByIdAndUpdate(
        selectedDate[0]._id,
        {
          $set: { avaliableSlot: updateSlot },
        },
        {
          new: true,
          runValidators: true,
          useFindAndModify: false,
        }
      );

      // console.log(updateSlot);
      await schedData.remove();
      const user_idss = req?.user._id;

      const activitylogs = await ActivityLogs.create({
        user_id: user_idss,
        description: "Cancel the afternoon recreational activity schedule",
      });

      console.log(activitylogs);
      return res.status(200).json({
        success: true,
      });
    }
  } else if (schedData.category == "Multipurpose Hall") {
    await schedData.remove();
    const user_idss = req?.user._id;

    const activitylogs = await ActivityLogs.create({
      user_id: user_idss,
      description: "Cancel the multipurpose schedule",
    });

    console.log(activitylogs);

    return res.status(200).json({
      success: true,
    });
  } else if (schedData.category == "Dialysis") {
    if (schedData.time == "am") {
      const date = schedData.date_schedule;
      var yesterdate = new Date(date.setDate(date.getDate()));
      const dateUpdate = yesterdate.toLocaleDateString();

      const selectedDate = await Slot_dialysis_am.find({ date: dateUpdate });

      const updateSlot = selectedDate[0].avaliableSlot + 1;

      const updatedSlot = await Slot_dialysis_am.findByIdAndUpdate(
        selectedDate[0]._id,
        {
          $set: { avaliableSlot: updateSlot },
        },
        {
          new: true,
          runValidators: true,
          useFindAndModify: false,
        }
      );

      // console.log(updateSlot);
      await schedData.remove();
      const activitylogs = await ActivityLogs.create({
        user_id: user_idss,
        description: "Cancel the morning dialysis schedule",
      });

      console.log(activitylogs);
      return res.status(200).json({
        success: true,
      });
    } else {
      const date = schedData.date_schedule;
      var yesterdate = new Date(date.setDate(date.getDate()));
      const dateUpdate = yesterdate.toLocaleDateString();

      const selectedDate = await Slot_dialysis_pm.find({ date: dateUpdate });

      const updateSlot = selectedDate[0].avaliableSlot + 1;

      const updatedSlot = await Slot_dialysis_pm.findByIdAndUpdate(
        selectedDate[0]._id,
        {
          $set: { avaliableSlot: updateSlot },
        },
        {
          new: true,
          runValidators: true,
          useFindAndModify: false,
        }
      );

      // console.log(updateSlot);
      await schedData.remove();
      const user_idss = req?.user._id;

      const activitylogs = await ActivityLogs.create({
        user_id: user_idss,
        description: "Cancel the afternoon dialysis schedule",
      });

      console.log(activitylogs);
      return res.status(200).json({
        success: true,
      });
    }
  }
};

exports.add = async (req, res) => {
  const {
    date,
    user_id,
    category,
    category_time,
    status,
    recreational_services2,
  } = req.body;
  // console.log(req.body)

  if (category_time == "recreational_am") {
    /////////////////slot
    const selectedDate = await Slot_recreational_am.find({ date: date });
    const updateSlot = selectedDate[0].avaliableSlot - 1;

    const updatedSlot = await Slot_recreational_am.findByIdAndUpdate(
      selectedDate[0]._id,
      {
        avaliableSlot: updateSlot,
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
    ////////////////////////////////////////////////////

    // const tomorrow = new Date(date)

    // var todates= new Date(tomorrow.setDate(tomorrow.getDate()+1)).toISOString() ;
    const nowss = moment(new Date(date)).format("YYYY-MM-DD");

    var todate = new Date(nowss).toISOString();

    // console.log(nowss);

    const schedule = await Schedule.create({
      user_id: user_id,
      date_schedule: todate,
      category: category,
      time: "am",
      status: status,
      recreational_services: recreational_services2,
    });

    const activitylogs = await ActivityLogs.create({
      user_id: user_id,
      description: "Book a Morning of " + schedule.category + " services",
    });

    console.log(activitylogs);

    const latest_data = await Schedule.find({}).sort({ _id: -1 }).limit(1);
    const latest_data_id = latest_data[0]._id;
    let id_stringdata = JSON.stringify(latest_data_id);

    const qrOption = {
      margin: 2,
      width: 175,
    };

    const bufferImage = await qr.toDataURL(id_stringdata, qrOption);

    const result = await cloudinary.v2.uploader.upload(bufferImage, {
      folder: "qrcode",
    });

    const schedulesqr = await Schedule.findByIdAndUpdate(
      latest_data_id,
      {
        $push: {
          qr_code: {
            public_id: result.public_id,
            url: result.secure_url,
          },
        },
      },
      {
        new: true,
        validateBeforeSave: false,
      }
    );

    //   console.log(bufferImage);

    return res.status(200).json({
      success: true,
      message: "success",
    });
  } else if (category_time == "recreational_pm") {
    /////////////////slot
    const selectedDate = await Slot_recreational_pm.find({ date: date });
    const updateSlot = selectedDate[0].avaliableSlot - 1;

    const updatedSlot = await Slot_recreational_pm.findByIdAndUpdate(
      selectedDate[0]._id,
      {
        avaliableSlot: updateSlot,
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
    ////////////////////////////////////////////////////

    // const tomorrow = new Date(date)

    // var todates= new Date(tomorrow.setDate(tomorrow.getDate()+1)).toISOString() ;
    const nowss = moment(new Date(date)).format("YYYY-MM-DD");

    var todate = new Date(nowss).toISOString();

    // console.log(nowss);

    const schedule = await Schedule.create({
      user_id: user_id,
      date_schedule: todate,
      category: category,
      time: "pm",
      status: status,
      recreational_services: recreational_services2,
    });

    const activitylogs = await ActivityLogs.create({
      user_id: user_id,
      description: "Book a Afternoon of " + schedule.category + " services",
    });

    console.log(activitylogs);

    const latest_data = await Schedule.find({}).sort({ _id: -1 }).limit(1);
    const latest_data_id = latest_data[0]._id;
    let id_stringdata = JSON.stringify(latest_data_id);

    const qrOption = {
      margin: 2,
      width: 175,
    };

    const bufferImage = await qr.toDataURL(id_stringdata, qrOption);

    const result = await cloudinary.v2.uploader.upload(bufferImage, {
      folder: "qrcode",
    });

    const schedulesqr = await Schedule.findByIdAndUpdate(
      latest_data_id,
      {
        $push: {
          qr_code: {
            public_id: result.public_id,
            url: result.secure_url,
          },
        },
      },
      {
        new: true,
        validateBeforeSave: false,
      }
    );

    //   console.log(bufferImage);

    return res.status(200).json({
      success: true,
      message: "success",
    });
  } else if (category_time == "multipurpose_am") {
    const nowss = moment(new Date(date)).format("YYYY-MM-DD");

    var todate = new Date(nowss).toISOString();

    // console.log(nowss);

    const schedule = await Schedule.create({
      user_id: user_id,
      date_schedule: todate,
      category: category,
      time: "am",
      status: status,
    });

    const activitylogs = await ActivityLogs.create({
      user_id: user_id,
      description: "Book a Morning of " + schedule.category + " services",
    });

    console.log(activitylogs);

    const latest_data = await Schedule.find({}).sort({ _id: -1 }).limit(1);
    const latest_data_id = latest_data[0]._id;
    let id_stringdata = JSON.stringify(latest_data_id);

    const qrOption = {
      margin: 2,
      width: 175,
    };

    const bufferImage = await qr.toDataURL(id_stringdata, qrOption);

    const result = await cloudinary.v2.uploader.upload(bufferImage, {
      folder: "qrcode",
    });

    const schedulesqr = await Schedule.findByIdAndUpdate(
      latest_data_id,
      {
        $push: {
          qr_code: {
            public_id: result.public_id,
            url: result.secure_url,
          },
        },
      },
      {
        new: true,
        validateBeforeSave: false,
      }
    );

    //   console.log(bufferImage);

    return res.status(200).json({
      success: true,
      message: "success",
    });
  } else if (category_time == "multipurpose_pm") {
    const nowss = moment(new Date(date)).format("YYYY-MM-DD");

    var todate = new Date(nowss).toISOString();

    // console.log(nowss);

    const schedule = await Schedule.create({
      user_id: user_id,
      date_schedule: todate,
      category: category,
      time: "pm",
      status: status,
    });

    const activitylogs = await ActivityLogs.create({
      user_id: user_id,
      description: "Book a Afternoon of " + schedule.category + " services",
    });

    console.log(activitylogs);
    const latest_data = await Schedule.find({}).sort({ _id: -1 }).limit(1);
    const latest_data_id = latest_data[0]._id;
    let id_stringdata = JSON.stringify(latest_data_id);

    const qrOption = {
      margin: 2,
      width: 175,
    };

    const bufferImage = await qr.toDataURL(id_stringdata, qrOption);

    const result = await cloudinary.v2.uploader.upload(bufferImage, {
      folder: "qrcode",
    });

    const schedulesqr = await Schedule.findByIdAndUpdate(
      latest_data_id,
      {
        $push: {
          qr_code: {
            public_id: result.public_id,
            url: result.secure_url,
          },
        },
      },
      {
        new: true,
        validateBeforeSave: false,
      }
    );

    //   console.log(bufferImage);

    return res.status(200).json({
      success: true,
      message: "success",
    });
  } else if (category_time == "multipurpose_wholeday") {
    const nowss = moment(new Date(date)).format("YYYY-MM-DD");

    var todate = new Date(nowss).toISOString();

    // console.log(nowss);

    const schedule = await Schedule.create({
      user_id: user_id,
      date_schedule: todate,
      category: category,
      time: "whole_day",
      status: status,
    });

    const activitylogs = await ActivityLogs.create({
      user_id: user_id,
      description: "Book a Wholeday of " + schedule.category + " services",
    });
    console.log(activitylogs);

    const latest_data = await Schedule.find({}).sort({ _id: -1 }).limit(1);
    const latest_data_id = latest_data[0]._id;
    let id_stringdata = JSON.stringify(latest_data_id);

    const qrOption = {
      margin: 2,
      width: 175,
    };

    const bufferImage = await qr.toDataURL(id_stringdata, qrOption);

    const result = await cloudinary.v2.uploader.upload(bufferImage, {
      folder: "qrcode",
    });

    const schedulesqr = await Schedule.findByIdAndUpdate(
      latest_data_id,
      {
        $push: {
          qr_code: {
            public_id: result.public_id,
            url: result.secure_url,
          },
        },
      },
      {
        new: true,
        validateBeforeSave: false,
      }
    );

    //   console.log(bufferImage);

    return res.status(200).json({
      success: true,
      message: "success",
    });
  } else if (category_time == "dialysis_am") {
    const selectedDate = await Slot_dialysis_am.find({ date: date });
    const updateSlot = selectedDate[0].avaliableSlot - 1;

    const updatedSlot = await Slot_dialysis_am.findByIdAndUpdate(
      selectedDate[0]._id,
      {
        avaliableSlot: updateSlot,
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
    ////////////////////////////////////////////////////

    // const tomorrow = new Date(date)

    // var todates= new Date(tomorrow.setDate(tomorrow.getDate()+1)).toISOString() ;
    const nowss = moment(new Date(date)).format("YYYY-MM-DD");

    var todate = new Date(nowss).toISOString();

    // console.log(nowss);

    const schedule = await Schedule.create({
      user_id: user_id,
      date_schedule: todate,
      category: category,
      time: "am",
      status: status,
    });

    const activitylogs = await ActivityLogs.create({
      user_id: user_id,
      description: "Book a Morning of " + schedule.category + " services",
    });

    console.log(activitylogs);

    const latest_data = await Schedule.find({}).sort({ _id: -1 }).limit(1);
    const latest_data_id = latest_data[0]._id;
    let id_stringdata = JSON.stringify(latest_data_id);

    const qrOption = {
      margin: 2,
      width: 175,
    };

    const bufferImage = await qr.toDataURL(id_stringdata, qrOption);

    const result = await cloudinary.v2.uploader.upload(bufferImage, {
      folder: "qrcode",
    });

    const schedulesqr = await Schedule.findByIdAndUpdate(
      latest_data_id,
      {
        $push: {
          qr_code: {
            public_id: result.public_id,
            url: result.secure_url,
          },
        },
      },
      {
        new: true,
        validateBeforeSave: false,
      }
    );

    //   console.log(bufferImage);

    return res.status(200).json({
      success: true,
      message: "success",
    });
  } else if (category_time == "dialysis_pm") {
    const selectedDate = await Slot_dialysis_pm.find({ date: date });
    const updateSlot = selectedDate[0].avaliableSlot - 1;

    const updatedSlot = await Slot_dialysis_pm.findByIdAndUpdate(
      selectedDate[0]._id,
      {
        avaliableSlot: updateSlot,
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
    ////////////////////////////////////////////////////

    // const tomorrow = new Date(date)

    // var todates= new Date(tomorrow.setDate(tomorrow.getDate()+1)).toISOString() ;
    const nowss = moment(new Date(date)).format("YYYY-MM-DD");

    var todate = new Date(nowss).toISOString();

    // console.log(nowss);

    const schedule = await Schedule.create({
      user_id: user_id,
      date_schedule: todate,
      category: category,
      time: "pm",
      status: status,
    });

    const activitylogs = await ActivityLogs.create({
      user_id: user_id,
      description: "Book an afternoon of " + schedule.category + " services",
    });

    console.log(activitylogs);

    const latest_data = await Schedule.find({}).sort({ _id: -1 }).limit(1);
    const latest_data_id = latest_data[0]._id;
    let id_stringdata = JSON.stringify(latest_data_id);

    const qrOption = {
      margin: 2,
      width: 175,
    };

    const bufferImage = await qr.toDataURL(id_stringdata, qrOption);

    const result = await cloudinary.v2.uploader.upload(bufferImage, {
      folder: "qrcode",
    });

    const schedulesqr = await Schedule.findByIdAndUpdate(
      latest_data_id,
      {
        $push: {
          qr_code: {
            public_id: result.public_id,
            url: result.secure_url,
          },
        },
      },
      {
        new: true,
        validateBeforeSave: false,
      }
    );

    //   console.log(bufferImage);

    return res.status(200).json({
      success: true,
      message: "success",
    });
  }
};

///================================ attendee

exports.attendeesList = async (req, res) => {
  const nowss = moment(new Date()).format("YYYY-MM-DD");

  var todate = new Date(nowss).toISOString();

  const allAttendees = await Schedule.find({ date_schedule: todate }).populate(
    "user_id"
  );

  const user_idss = req?.user._id;

  const activitylogs = await ActivityLogs.create({
    user_id: user_idss,
    description: "View attendees",
  });

  console.log(activitylogs);

  return res.status(200).json({
    length: allAttendees.length,
    success: true,
    allAttendees,
  });
};
