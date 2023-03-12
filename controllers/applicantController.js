const Applicant = require('../models/applicant')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const { google } = require('googleapis');
const CLIENT_ID = '245985647212-17ekq9p43o5e2u9iei49tmlhqaqqdouh.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const stream = require("stream");
const REFRESH_TOKEN = '1//04sTDhftwMYhLCgYIARAAGAQSNwF-L9Ir2gMbL1h39Mxidzg7hCQCbSAKJ84BVCNX9sGai1j8ojVbIsrfpi2jVjjmf1FqAp8g1Ds';
const Readable = require('stream').Readable; 
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  auth: {
    user: "bsitns.elaga@gmail.com",
    pass: "alvisxcsfnzgojqf"
  },
  from: 'bsitns.elaga@gmail.com'
});


const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  
  const drive = google.drive({
    version: 'v3',
    auth: oauth2Client,
  });

exports.newApplicant = catchAsyncErrors(async(req,res,next) => {
	
    try {
        const { first_name, middle_name, last_name, email, 
            contact_number,position} = req.body;
            const { document} = req.files;

            const newApplicantData = {
                first_name: first_name,
                middle_name: middle_name,
                last_name: last_name,
                email: email,
                contact_number: contact_number,
                position: position,
              }


  //============= upload newww LARGE FILE
            if (document !== '') {
                function bufferToStream(buffer) { 
                    var stream = new Readable();
                    stream.push(buffer);
                    stream.push(null);
                
                    return stream;
                }
                    const response = await drive.files.create({
                    requestBody: {
                        'parents':  ['1Txj-XKNoGgfYkeuqojY_Bjzh8qkqDDJ_'],
                        name: document.name,
                    },
                    media: {
                        body: bufferToStream(document.data),
                    },
                    
                    });

                    console.log(response)

                    const fileId = response.data.id;
                
                        await drive.permissions.create({
                            fileId: fileId,
                            requestBody: {
                            role: 'reader',
                            type: 'anyone',
                            },
                        });

                        
                newApplicantData.document = {
                            public_id: fileId,
                            url: `https://drive.google.com/uc?export=view&id=${fileId}`,
                        }

                    }
               
          transporter.sendMail({
                      from: 'eAlaga <bsitns.elaga@gmail.com>',
                      to: email,
                      subject: 'Application',
                      html: `<p>Thanks for applying wait for the admin to accept your application</p>`
                
                    })

          const applicant = await Applicant.create(newApplicantData)

         
	
          return res.status(200).json({
            success: true,
            message:"success"
          })

}  catch (error) {
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


exports.getApplicant = catchAsyncErrors(async (req, res, next) => {
  const applicant = await Applicant.find();

  // console.log(user)
  res.json({applicant});

})

exports.viewApplicant = catchAsyncErrors(async (req, res, next) => {

  const { id } = req.params
  const applicant = await Applicant.findById({'_id':id});

  console.log(applicant)

  res.json({applicant});

})

exports.acceptApplicant = catchAsyncErrors(async (req, res, next) => {

  const { id } = req.params

  const applicant = await Applicant.findByIdAndUpdate(id, {status: "accepted"}, {
    new: true,
    runValidators: true,
    useFindAndModify: false
    })

    transporter.sendMail({
      from: 'eAlaga <bsitns.elaga@gmail.com>',
      to: applicant.email,
      subject: 'Application Accepted',
      html: `<p>Your application is accepted by admin</p>`

    })
    
  console.log(applicant)

  res.json({applicant});

})

exports.deniedApplicant = catchAsyncErrors(async (req, res, next) => {

  const { id } = req.params

  const applicant = await Applicant.findByIdAndUpdate(id, {status: "denied"}, {
    new: true,
    runValidators: true,
    useFindAndModify: false
    })

    transporter.sendMail({
      from: 'eAlaga <bsitns.elaga@gmail.com>',
      to: applicant.email,
      subject: 'Application Denied',
      html: `<p>Your application is denied by admin</p>`

    })

  console.log(applicant)

  res.json({applicant});

})