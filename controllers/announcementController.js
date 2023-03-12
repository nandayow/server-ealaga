const Announcement = require('../models/announcement')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');

exports.newAnnouncement = catchAsyncErrors(async(req,res,next) => {
	// console.log(req.body);
    try {
	const announcement = await Announcement.create(req.body);
	res.status(201).json({
		success:true,
		announcement 
	})}  catch (error) {
        if (error.name === "ValidationError") {
          let errors = {};
    
          Object.keys(error.errors).forEach((key) => {
            errors[key] = error.errors[key].message;
          });
          
          console.log(errors)
    
          return res.status(400).send(errors);
        }
        res.status(500).send("Something went wrong");
      }
})

exports.getAnnouncement = catchAsyncErrors(async (req, res, next) => {
    const announcement = await Announcement.find();
  
    // console.log(user)
    res.json({announcement});
  
  })

exports.editAnnouncement = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const announcement = await Announcement.findOneAndUpdate({'status' : "set"},
    {$set:{'status' : "not set"}},{
        new: true,
        runValidators: true,
        useFindAndModify: false
        }
    );

    await Announcement.findByIdAndUpdate(id, {$set:{'status' : "set"}}, {
        new: true,
        runValidators: true,
        useFindAndModify: false
        })

    console.log(announcement)
    res.json({announcement});
  
  })

  exports.deleteAnnouncement= catchAsyncErrors(async (req, res, next) => {
    console.log(req.params.id)
    try{
    const announcement = await Announcement.findById(req.params.id);

    await announcement.remove();

    res.status(200).json({
        success: true,
        message: 'Announcement is deleted.'
    })
    }catch(err){
        res.status(400).json({
            message: "Disease not found"
        })
    }

})