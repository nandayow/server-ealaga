const User = require("../models/user");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const emailvalidator = require("email-validator");
const crypto = require("crypto");
const Health = require("../models/health");
const cloudinary = require("cloudinary");
const Schedule = require("../models/schedule");
const ActivityLogs = require("../models/activitylogs");
const { google } = require("googleapis");
const CLIENT_ID =
  "245985647212-17ekq9p43o5e2u9iei49tmlhqaqqdouh.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const stream = require("stream");
const REFRESH_TOKEN =
  "1//04sTDhftwMYhLCgYIARAAGAQSNwF-L9Ir2gMbL1h39Mxidzg7hCQCbSAKJ84BVCNX9sGai1j8ojVbIsrfpi2jVjjmf1FqAp8g1Ds";
const Readable = require("stream").Readable;

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

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  console.log("hello");
  if (!email) {
    return res.status(400).send({
      email: "Please enter email / username",
    });
  }

  try {
    // Step 1 - Verify a user with the email exists
    let user;

    if (email.includes("@")) {
      user = await User.findOne({ email: email }).select("+password");
    } else {
      user = await User.findOne({ user_name: email }).select("+password");
    }

    // const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(400).send({
        email: "User not found",
      });
    }

    if (!password) {
      return res.status(400).send({
        password: "Please enter password",
      });
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      return res.status(400).send({
        password: "Incorrect password",
      });
    }

    if (!user.email_verified) {
      return res.status(201).json({
        message: "verifyEmail",
      });
    }

    if (user.status === "inactive") {
      return res.status(201).json({
        message: "inactive",
      });
    }
    // const token = jwt.sign(
    //   { _id: user._id, role: user.role },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "1d" }
    // );
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.user_name,
        firstname: user.first_name,
        middlename: user.middle_name,
        lastname: user.last_name,
        profile_picture: user.profile_picture,
        email: user.email,
        role: user.role,
        gender: user.gender,
        birth_date: user.birth_date,
        address: user.address,
        phone: user.phone,
        health_id: user.health_id,
        account_verified: user.account_verified,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const activitylogs = await ActivityLogs.create({
      user_id: user._id,
      description: "Logged In",
    });

    console.log(activitylogs);

    return res.json({ token: token, user });
  } catch (err) {
    return res.status(500).send(err);
  }
};

exports.verify = async (req, res) => {
  const emailVerificationToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  // console.log(emailVerificationToken);

  const user = await User.findOne({
    emailVerificationToken,
  });

  if (!user) {
    return res.status(201).json({
      message: "tokenExpired",
    });
  }
  user.email_verified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  user.expire_at = undefined;

  const activitylogs = await ActivityLogs.create({
    user_id: user._id,
    description: "Verified the email",
  });

  await user.save();
  return res.status(201).json({
    message: "Success",
  });
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "ealaga.taguig@gmail.com",
    pass: "vvdieymyrlrpbzhn",
  },
  // from: 'ealaga.taguig@gmail.com',
  tls: {
    ciphers: "SSLv3",
  },
});

exports.signup = catchAsyncErrors(async (req, res, next) => {
  // console.log(transporter);
  // console.log(req.body);
  try {
    const {
      first_name,
      middle_name,
      last_name,
      user_name,
      email,
      password,
      confirmPassword,
      role,
      status,
    } = req.body;

    const existingUser = await User.findOne({ email }).exec();
    const existingUsername = await User.findOne({ user_name }).exec();

    if (existingUser) {
      return res.status(400).send({
        email: "Not Available",
      });
    }
    if (existingUsername) {
      return res.status(400).send({
        user_name: "Username is already in use.",
      });
    }

    if (password != confirmPassword) {
      return res.status(400).send({
        confirmPassword: "Confirm password is not matched.",
      });
    }

    const user = await User.create({
      first_name,
      middle_name,
      last_name,
      user_name,
      email,
      password,
      role,
      status,
      profile_picture: {
        public_id: "profile_picture/jttdi63mt8a6e4ndt3icdsadsada",
        url: "https://pbs.twimg.com/media/Cqny3hKWAAADr8z.jpg",
      },
      role: role,
      status: status,
    });

    const emailToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Create reset password url
    const url = `${process.env.FRONTEND_URL}/#/verified/${emailToken}`;

    transporter.sendMail({
      from: "eAlaga <bsitns.elaga@gmail.com>",
      to: email,
      subject: "Verify Email",
      html: `<body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0" style="width:100% ;-webkit-text-size-adjust:none;margin:0;padding:0;background-color:#FAFAFA;">
            <center>
              <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="backgroundTable" style="height:100% ;margin:0;padding:0;width:100% ;background-color:#FAFAFA;">
                <tr>
                  <td align="center" valign="top" style="border-collapse:collapse;">
                    <!-- // Begin Template Preheader \\ -->
                    <table border="0" cellpadding="10" cellspacing="0" width="450" id="templatePreheader" style="background-color:#FAFAFA;">
                      <tr>
                        <td valign="top" class="preheaderContent" style="border-collapse:collapse;">
                          <!-- // Begin Module: Standard Preheader \\ -->
                          <table border="0" cellpadding="10" cellspacing="0" width="100%">
                            <tr>
                              <td valign="top" style="border-collapse:collapse;">
                                <!-- <div mc:edit="std_preheader_content">
                                                               Use this area to offer a short teaser of your email's content. Text here will show in the preview area of some email clients.
                                                            </div>
                                                            -->
                              </td>
                            </tr>
                          </table>
                          <!-- // End Module: Standard Preheader \\ -->
                        </td>
                      </tr>
                    </table>
                    <!-- // End Template Preheader \\ -->
                    <table border="0" cellpadding="0" cellspacing="0" width="450" id="templateContainer" style="border:1px none #DDDDDD;background-color:#FFFFFF;">
                      <tr>
                        <td align="center" valign="top" style="border-collapse:collapse;">
                          <!-- // Begin Template Header \\ -->
                          <table border="0" cellpadding="0" cellspacing="0" width="450" id="templateHeader" style="background-color:#FFFFFF;border-bottom:0;">
                            <tr>
                              <td class="headerContent centeredWithBackground" style="border-collapse:collapse;color:#202020;font-family:Arial;font-size:34px;font-weight:bold;line-height:100%;padding:0;text-align:center;vertical-align:middle;background-color:#F4EEE2;padding-bottom:20px;padding-top:20px;">
                                <!-- // Begin Module: Standard Header Image \\ -->
                                <img width="200" src="https://res.cloudinary.com/du7wzlg44/image/upload/v1658764147/opening_2_svmbic.png" style="width:130px;max-width:130px;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;" id="headerImage campaign-icon">
                                <!-- // End Module: Standard Header Image \\ -->
                              </td>
                            </tr>
                          </table>
                          <!-- // End Template Header \\ -->
                        </td>
                      </tr>
                      <tr>
                        <td align="center" valign="top" style="border-collapse:collapse;">
                          <!-- // Begin Template Body \\ -->
                          <table border="0" cellpadding="0" cellspacing="0" width="450" id="templateBody">
                            <tr>
                              <td valign="top" class="bodyContent" style="border-collapse:collapse;background-color:#FFFFFF;">
                                <!-- // Begin Module: Standard Content \\ -->
                                <table border="0" cellpadding="20" cellspacing="0" width="100%" style="padding-bottom:10px;">
                                  <tr>
                                    <td valign="top" style="padding-bottom:1rem;border-collapse:collapse;" class="mainContainer">
                                      <div style="text-align:left;color:#505050;font-family:Arial;font-size:14px;line-height:150%;">
                                        <h1 class="h1" style="color:#202020;display:block;font-family:Arial;font-size:24px;font-weight:bold;line-height:100%;margin-top:20px;margin-right:0;margin-bottom:20px;margin-left:0;text-align:left;">Hey, ${first_name}!</h1>
                                        <p> Thanks for registering an account with eAlaga.</p>
                                        <p style="margin-bottom:-20px">Before we get started, Please click the button below to verify your email.</p>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td align="center" style="border-collapse:collapse;">
                                      <table border="0" cellpadding="0" cellspacing="0" style="padding-bottom:10px;">
                                        <tbody>
                                          <tr align="center">
                                            <td align="center" valign="middle" style="border-collapse:collapse;">
                                              <a class="buttonText" href='${url}' target="_blank" style="color: #EF3A47;text-decoration: none;font-weight: normal;display: block;border: 2px solid #EF3A47;padding: 10px 80px;font-family: Arial;">Verify</a>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                   <tr>
                                    <td valign="top" style="padding-bottom:1rem;border-collapse:collapse;" class="mainContainer">
                                      <div style="text-align:left;color:#505050;font-family:Arial;font-size:14px;line-height:150%;">
                                        <p style="margin-top:-30px">This email verification link will expire in 30 minutes.</p>
                                        <p style="margin-bottom:-15px">Regards,</p>
                                         <p>eAlaga</p>
                                      </div>
                                    </td>
                                  </tr>
                                  
                                </table>
                                <!-- // End Module: Standard Content \\ -->
                              </td>
                            </tr>
                          </table>
                          <!-- // End Template Body \\ -->
                        </td>
                      </tr>
                      <tr>
                        <td align="center" valign="top" style="border-collapse:collapse;">
                          <!-- // Begin Support Section \\ -->
                          <table border="0" cellpadding="10" cellspacing="0" width="450" id="supportSection" style="background-color:white;font-family:arial;font-size:12px;border-top:1px solid #e4e4e4;">
                            <tr>
                              <td valign="top" class="supportContent" style="border-collapse:collapse;background-color:white;font-family:arial;font-size:12px;border-top:1px solid #e4e4e4;">
                                <!-- // Begin Module: Standard Footer \\ -->
                             
                              </td>
                            </tr>
                          </table>
                          <!-- // Begin Support Section \\ -->
                        </td>
                      </tr>
                    
                    </table>
                    <br>
                  </td>
                </tr>
              </table>
            </center>
          </body>

          <style type="text/css">
    #outlook a{
        padding:0;
      }
      body{
        width:100% !important;
      }
      .ReadMsgBody{
        width:100%;
      }
      .ExternalClass{
        width:100%;
      }
      body{
        -webkit-text-size-adjust:none;
      }
      body{
        margin:0;
        padding:0;
      }
      img{
        border:0;
        height:auto;
        line-height:100%;
        outline:none;
        text-decoration:none;
      }
      table td{
        border-collapse:collapse;
      }
      #backgroundTable{
        height:100% !important;
        margin:0;
        padding:0;
        width:100% !important;
      }
    /*
    @tab Page
    @section background color
    @tip Set the background color for your email. You may want to choose one that matches your company's branding.
    @theme page
    */
      body,#backgroundTable{
        /*@editable*/background-color:#FAFAFA;
      }
    /*
    @tab Page
    @section email border
    @tip Set the border for your email.
    */
      #templateContainer{
        /*@editable*/border:1px none #DDDDDD;
      }
    /*
    @tab Page
    @section heading 1
    @tip Set the styling for all first-level headings in your emails. These should be the largest of your headings.
    @style heading 1
    */
      h1,.h1{
        /*@editable*/color:#202020;
        display:block;
        /*@editable*/font-family:Arial;
        /*@editable*/font-size:24px;
        /*@editable*/font-weight:bold;
        /*@editable*/line-height:100%;
        margin-top:20px;
        margin-right:0;
        margin-bottom:20px;
        margin-left:0;
        /*@editable*/text-align:center;
      }
    /*
    @tab Page
    @section heading 2
    @tip Set the styling for all second-level headings in your emails.
    @style heading 2
    */
      h2,.h2{
        /*@editable*/color:#202020;
        display:block;
        /*@editable*/font-family:Arial;
        /*@editable*/font-size:30px;
        /*@editable*/font-weight:bold;
        /*@editable*/line-height:100%;
        margin-top:0;
        margin-right:0;
        margin-bottom:10px;
        margin-left:0;
        /*@editable*/text-align:center;
      }
    /*
    @tab Page
    @section heading 3
    @tip Set the styling for all third-level headings in your emails.
    @style heading 3
    */
      h3,.h3{
        /*@editable*/color:#202020;
        display:block;
        /*@editable*/font-family:Arial;
        /*@editable*/font-size:26px;
        /*@editable*/font-weight:bold;
        /*@editable*/line-height:100%;
        margin-top:0;
        margin-right:0;
        margin-bottom:10px;
        margin-left:0;
        /*@editable*/text-align:center;
      }
    /*
    @tab Page
    @section heading 4
    @tip Set the styling for all fourth-level headings in your emails. These should be the smallest of your headings.
    @style heading 4
    */
      h4,.h4{
        /*@editable*/color:#202020;
        display:block;
        /*@editable*/font-family:Arial;
        /*@editable*/font-size:22px;
        /*@editable*/font-weight:bold;
        /*@editable*/line-height:100%;
        margin-top:0;
        margin-right:0;
        margin-bottom:10px;
        margin-left:0;
        /*@editable*/text-align:center;
      }
    /*
    @tab Header
    @section preheader style
    @tip Set the background color for your email's preheader area.
    @theme page
    */
      #templatePreheader{
        /*@editable*/background-color:#FAFAFA;
      }
    /*
    @tab Header
    @section preheader text
    @tip Set the styling for your email's preheader text. Choose a size and color that is easy to read.
    */
      .preheaderContent div{
        /*@editable*/color:#505050;
        /*@editable*/font-family:Arial;
        /*@editable*/font-size:10px;
        /*@editable*/line-height:100%;
        /*@editable*/text-align:left;
      }
    /*
    @tab Header
    @section preheader link
    @tip Set the styling for your email's preheader links. Choose a color that helps them stand out from your text.
    */
      .preheaderContent div a:link,.preheaderContent div a:visited,.preheaderContent div a .yshortcuts {
        /*@editable*/color:#336699;
        /*@editable*/font-weight:normal;
        /*@editable*/text-decoration:underline;
      }
      .preheaderContent img{
        display:inline;
        height:auto;
        margin-bottom:10px;
        max-width:280px;
      }
    /*
    @tab Header
    @section header style
    @tip Set the background color and border for your email's header area.
    @theme header
    */
      #templateHeader{
        /*@editable*/background-color:#FFFFFF;
        /*@editable*/border-bottom:0;
      }
    /*
    @tab Header
    @section header text
    @tip Set the styling for your email's header text. Choose a size and color that is easy to read.
    */
      .headerContent{
        /*@editable*/color:#202020;
        /*@editable*/font-family:Arial;
        /*@editable*/font-size:34px;
        /*@editable*/font-weight:bold;
        /*@editable*/line-height:100%;
        /*@editable*/padding:0;
        /*@editable*/text-align:left;
        /*@editable*/vertical-align:middle;
        background-color: #FAFAFA;
          padding-bottom: 14px;
      }
    /*
    @tab Header
    @section header link
    @tip Set the styling for your email's header links. Choose a color that helps them stand out from your text.
    */
      .headerContent a:link,.headerContent a:visited,.headerContent a .yshortcuts {
        /*@editable*/color:#336699;
        /*@editable*/font-weight:normal;
        /*@editable*/text-decoration:underline;
      }
      #headerImage{
        height:auto;
        max-width:400px !important;
      }
    /*
    @tab Body
    @section body style
    @tip Set the background color for your email's body area.
    */
      #templateContainer,.bodyContent{
        /*@editable*/background-color:#FFFFFF;
      }
    /*
    @tab Body
    @section body text
    @tip Set the styling for your email's main content text. Choose a size and color that is easy to read.
    @theme main
    */
      .bodyContent div{
        /*@editable*/color:#505050;
        /*@editable*/font-family:Arial;
        /*@editable*/font-size:14px;
        /*@editable*/line-height:150%;
        /*@editable*/text-align:left;
      }
    /*
    @tab Body
    @section body link
    @tip Set the styling for your email's main content links. Choose a color that helps them stand out from your text.
    */
      .bodyContent div a:link,.bodyContent div a:visited,.bodyContent div a .yshortcuts {
        /*@editable*/color:#336699;
        /*@editable*/font-weight:normal;
        /*@editable*/text-decoration:underline;
      }
      .bodyContent img{
        display:inline;
        height:auto;
        margin-bottom:10px;
        max-width:280px;
      }
    /*
    @tab Footer
    @section footer style
    @tip Set the background color and top border for your email's footer area.
    @theme footer
    */
      #templateFooter{
        /*@editable*/background-color:#FFFFFF;
        /*@editable*/border-top:0;
      }
    /*
    @tab Footer
    @section footer text
    @tip Set the styling for your email's footer text. Choose a size and color that is easy to read.
    @theme footer
    */
      .footerContent {
        background-color: #fafafa;
      }
      .footerContent div{
        /*@editable*/color:#707070;
        /*@editable*/font-family:Arial;
        /*@editable*/font-size:11px;
        /*@editable*/line-height:150%;
        /*@editable*/text-align:left;
      }
    /*
    @tab Footer
    @section footer link
    @tip Set the styling for your email's footer links. Choose a color that helps them stand out from your text.
    */
      .footerContent div a:link,.footerContent div a:visited,.footerContent div a .yshortcuts {
        /*@editable*/color:#336699;
        /*@editable*/font-weight:normal;
        /*@editable*/text-decoration:underline;
      }
      .footerContent img{
        display:inline;
      }
    /*
    @tab Footer
    @section social bar style
    @tip Set the background color and border for your email's footer social bar.
    @theme footer
    */
      #social{
        /*@editable*/background-color:#FAFAFA;
        /*@editable*/border:0;
      }
    /*
    @tab Footer
    @section social bar style
    @tip Set the background color and border for your email's footer social bar.
    */
      #social div{
        /*@editable*/text-align:left;
      }
    /*
    @tab Footer
    @section utility bar style
    @tip Set the background color and border for your email's footer utility bar.
    @theme footer
    */
      #utility{
        /*@editable*/background-color:#FFFFFF;
        /*@editable*/border:0;
      }
    /*
    @tab Footer
    @section utility bar style
    @tip Set the background color and border for your email's footer utility bar.
    */
      #utility div{
        /*@editable*/text-align:left;
      }
      #monkeyRewards img{
        display:inline;
        height:auto;
        max-width:280px;
      }
  
  
    /*
    ATAVIST CUSTOM STYLES 
     */
  
    .buttonText {
      color: #4A90E2;
      text-decoration: none;
      font-weight: normal;
      display: block;
      border: 2px solid #585858;
      padding: 10px 80px;
      font-family: Arial;
    }
  
    #supportSection, .supportContent {
      background-color: white;
      font-family: arial;
      font-size: 12px;
      border-top: 1px solid #e4e4e4;
    }
  
    .bodyContent table {
      padding-bottom: 10px;
    }
  
  
    .footerContent p {
      margin: 0;
      margin-top: 2px;
    }
  
    .headerContent.centeredWithBackground {
      background-color: #F4EEE2;
      text-align: center;
      padding-top: 20px;
      padding-bottom: 20px;
    }
        
     @media only screen and (min-device-width: 320px) and (max-device-width: 480px) {
            h1 {
                font-size: 40px !important;
            }
            
            .content {
                font-size: 22px !important;
            }
            
            .bodyContent p {
                font-size: 22px !important;
            }
            
            .buttonText {
                font-size: 22px !important;
            }
            
            p {
                
                font-size: 16px !important;
                
            }
            
            .footerContent p {
                padding-left: 5px !important;
            }
            
            .mainContainer {
                padding-bottom: 0 !important;   
            }
        }
      </style>
          
          `,
    });

    res.status(201).json({
      success: true,
      message: `Sent a verification email to ${email}`,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      let errors = {};

      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });

      // console.log(errors)

      return res.status(400).send(errors);
    }
    res.status(500).send("Something went wrong");
  }
});

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  const emailValid = emailvalidator.validate(email);

  // console.log(emailValid);

  if (!email) {
    return res.status(400).send({
      email: "Please enter email",
    });
  }

  if (!emailValid) {
    return res.status(400).send({
      email: "Please enter valid email",
    });
  }

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(400).send({
      email: "Email does not exist",
    });
  }

  // logs
  const activitylogs = await ActivityLogs.create({
    user_id: user._id,
    description: "Send a password reset link to their registered email address",
  });

  console.log(activitylogs);

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Create reset password url
  const url = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  try {
    transporter.sendMail({
      from: "eAlaga <bsitns.elaga@gmail.com>",
      to: user.email,
      subject: "Reset Password Notification",
      html: `<body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0" style="width:100% ;-webkit-text-size-adjust:none;margin:0;padding:0;background-color:#FAFAFA;">
          <center>
            <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="backgroundTable" style="height:100% ;margin:0;padding:0;width:100% ;background-color:#FAFAFA;">
              <tr>
                <td align="center" valign="top" style="border-collapse:collapse;">
                  <!-- // Begin Template Preheader \\ -->
                  <table border="0" cellpadding="10" cellspacing="0" width="450" id="templatePreheader" style="background-color:#FAFAFA;">
                    <tr>
                      <td valign="top" class="preheaderContent" style="border-collapse:collapse;">
                        <!-- // Begin Module: Standard Preheader \\ -->
                        <table border="0" cellpadding="10" cellspacing="0" width="100%">
                          <tr>
                            <td valign="top" style="border-collapse:collapse;">
                              <!-- <div mc:edit="std_preheader_content">
                                                             Use this area to offer a short teaser of your email's content. Text here will show in the preview area of some email clients.
                                                          </div>
                                                          -->
                            </td>
                          </tr>
                        </table>
                        <!-- // End Module: Standard Preheader \\ -->
                      </td>
                    </tr>
                  </table>
                  <!-- // End Template Preheader \\ -->
                  <table border="0" cellpadding="0" cellspacing="0" width="450" id="templateContainer" style="border:1px none #DDDDDD;background-color:#FFFFFF;">
                    <tr>
                      <td align="center" valign="top" style="border-collapse:collapse;">
                        <!-- // Begin Template Header \\ -->
                        <table border="0" cellpadding="0" cellspacing="0" width="450" id="templateHeader" style="background-color:#FFFFFF;border-bottom:0;">
                          <tr>
                            <td class="headerContent centeredWithBackground" style="border-collapse:collapse;color:#202020;font-family:Arial;font-size:34px;font-weight:bold;line-height:100%;padding:0;text-align:center;vertical-align:middle;background-color:#F4EEE2;padding-bottom:20px;padding-top:20px;">
                              <!-- // Begin Module: Standard Header Image \\ -->
                              <img width="200" src="https://res.cloudinary.com/du7wzlg44/image/upload/v1658764147/opening_2_svmbic.png" style="width:130px;max-width:130px;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;" id="headerImage campaign-icon">
                              <!-- // End Module: Standard Header Image \\ -->
                            </td>
                          </tr>
                        </table>
                        <!-- // End Template Header \\ -->
                      </td>
                    </tr>
                    <tr>
                      <td align="center" valign="top" style="border-collapse:collapse;">
                        <!-- // Begin Template Body \\ -->
                        <table border="0" cellpadding="0" cellspacing="0" width="450" id="templateBody">
                          <tr>
                            <td valign="top" class="bodyContent" style="border-collapse:collapse;background-color:#FFFFFF;">
                              <!-- // Begin Module: Standard Content \\ -->
                              <table border="0" cellpadding="20" cellspacing="0" width="100%" style="padding-bottom:10px;">
                                <tr>
                                  <td valign="top" style="padding-bottom:1rem;border-collapse:collapse;" class="mainContainer">
                                    <div style="text-align:center;color:#505050;font-family:Arial;font-size:14px;line-height:150%;">
                                      <h1 class="h1" style="color:#202020;display:block;font-family:Arial;font-size:24px;font-weight:bold;line-height:100%;margin-top:20px;margin-right:0;margin-bottom:20px;margin-left:0;text-align:center;">Reset Password Request</h1>
                                      <p style="text-align:left;">Hey, ${user.first_name}!.</p>
                                      <p style="text-align:left;">You are receiving this email because we received a password reset request for your account.</p>
                                      <p style="text-align:left;">This password reset link will expire in 60 minutes.</p>
                                      <a class="buttonText" href='${url}' target="_blank" style="color: #EF3A47;text-decoration: none;font-weight: normal;display: block;border: 2px solid #EF3A47;padding: 10px 80px;font-family: Arial;">Reset Password</a>
                                      <p style="text-align:left;">Regards,</p>
                                      <p style="text-align:left;">eAlaga</p>
                                      </div>
                                  </td>
                                </tr>
                              
                              </table>
                              <!-- // End Module: Standard Content \\ -->
                            </td>
                          </tr>
                        </table>
                        <!-- // End Template Body \\ -->
                      </td>
                    </tr>
                    <tr>
                      <td align="center" valign="top" style="border-collapse:collapse;">
                        <!-- // Begin Support Section \\ -->
                        <table border="0" cellpadding="10" cellspacing="0" width="450" id="supportSection" style="background-color:white;font-family:arial;font-size:12px;border-top:1px solid #e4e4e4;">
                          <tr>
                            <td valign="top" class="supportContent" style="border-collapse:collapse;background-color:white;font-family:arial;font-size:12px;border-top:1px solid #e4e4e4;">
                              <!-- // Begin Module: Standard Footer \\ -->
                           
                            </td>
                          </tr>
                        </table>
                        <!-- // Begin Support Section \\ -->
                      </td>
                    </tr>
                  
                  </table>
                  <br>
                </td>
              </tr>
            </table>
          </center>
        </body>

        <style type="text/css">
  #outlook a{
      padding:0;
    }
    body{
      width:100% !important;
    }
    .ReadMsgBody{
      width:100%;
    }
    .ExternalClass{
      width:100%;
    }
    body{
      -webkit-text-size-adjust:none;
    }
    body{
      margin:0;
      padding:0;
    }
    img{
      border:0;
      height:auto;
      line-height:100%;
      outline:none;
      text-decoration:none;
    }
    table td{
      border-collapse:collapse;
    }
    #backgroundTable{
      height:100% !important;
      margin:0;
      padding:0;
      width:100% !important;
    }
  /*
  @tab Page
  @section background color
  @tip Set the background color for your email. You may want to choose one that matches your company's branding.
  @theme page
  */
    body,#backgroundTable{
      /*@editable*/background-color:#FAFAFA;
    }
  /*
  @tab Page
  @section email border
  @tip Set the border for your email.
  */
    #templateContainer{
      /*@editable*/border:1px none #DDDDDD;
    }
  /*
  @tab Page
  @section heading 1
  @tip Set the styling for all first-level headings in your emails. These should be the largest of your headings.
  @style heading 1
  */
    h1,.h1{
      /*@editable*/color:#202020;
      display:block;
      /*@editable*/font-family:Arial;
      /*@editable*/font-size:24px;
      /*@editable*/font-weight:bold;
      /*@editable*/line-height:100%;
      margin-top:20px;
      margin-right:0;
      margin-bottom:20px;
      margin-left:0;
      /*@editable*/text-align:center;
    }
  /*
  @tab Page
  @section heading 2
  @tip Set the styling for all second-level headings in your emails.
  @style heading 2
  */
    h2,.h2{
      /*@editable*/color:#202020;
      display:block;
      /*@editable*/font-family:Arial;
      /*@editable*/font-size:30px;
      /*@editable*/font-weight:bold;
      /*@editable*/line-height:100%;
      margin-top:0;
      margin-right:0;
      margin-bottom:10px;
      margin-left:0;
      /*@editable*/text-align:center;
    }
  /*
  @tab Page
  @section heading 3
  @tip Set the styling for all third-level headings in your emails.
  @style heading 3
  */
    h3,.h3{
      /*@editable*/color:#202020;
      display:block;
      /*@editable*/font-family:Arial;
      /*@editable*/font-size:26px;
      /*@editable*/font-weight:bold;
      /*@editable*/line-height:100%;
      margin-top:0;
      margin-right:0;
      margin-bottom:10px;
      margin-left:0;
      /*@editable*/text-align:center;
    }
  /*
  @tab Page
  @section heading 4
  @tip Set the styling for all fourth-level headings in your emails. These should be the smallest of your headings.
  @style heading 4
  */
    h4,.h4{
      /*@editable*/color:#202020;
      display:block;
      /*@editable*/font-family:Arial;
      /*@editable*/font-size:22px;
      /*@editable*/font-weight:bold;
      /*@editable*/line-height:100%;
      margin-top:0;
      margin-right:0;
      margin-bottom:10px;
      margin-left:0;
      /*@editable*/text-align:center;
    }
  /*
  @tab Header
  @section preheader style
  @tip Set the background color for your email's preheader area.
  @theme page
  */
    #templatePreheader{
      /*@editable*/background-color:#FAFAFA;
    }
  /*
  @tab Header
  @section preheader text
  @tip Set the styling for your email's preheader text. Choose a size and color that is easy to read.
  */
    .preheaderContent div{
      /*@editable*/color:#505050;
      /*@editable*/font-family:Arial;
      /*@editable*/font-size:10px;
      /*@editable*/line-height:100%;
      /*@editable*/text-align:left;
    }
  /*
  @tab Header
  @section preheader link
  @tip Set the styling for your email's preheader links. Choose a color that helps them stand out from your text.
  */
    .preheaderContent div a:link,.preheaderContent div a:visited,.preheaderContent div a .yshortcuts {
      /*@editable*/color:#336699;
      /*@editable*/font-weight:normal;
      /*@editable*/text-decoration:underline;
    }
    .preheaderContent img{
      display:inline;
      height:auto;
      margin-bottom:10px;
      max-width:280px;
    }
  /*
  @tab Header
  @section header style
  @tip Set the background color and border for your email's header area.
  @theme header
  */
    #templateHeader{
      /*@editable*/background-color:#FFFFFF;
      /*@editable*/border-bottom:0;
    }
  /*
  @tab Header
  @section header text
  @tip Set the styling for your email's header text. Choose a size and color that is easy to read.
  */
    .headerContent{
      /*@editable*/color:#202020;
      /*@editable*/font-family:Arial;
      /*@editable*/font-size:34px;
      /*@editable*/font-weight:bold;
      /*@editable*/line-height:100%;
      /*@editable*/padding:0;
      /*@editable*/text-align:left;
      /*@editable*/vertical-align:middle;
      background-color: #FAFAFA;
        padding-bottom: 14px;
    }
  /*
  @tab Header
  @section header link
  @tip Set the styling for your email's header links. Choose a color that helps them stand out from your text.
  */
    .headerContent a:link,.headerContent a:visited,.headerContent a .yshortcuts {
      /*@editable*/color:#336699;
      /*@editable*/font-weight:normal;
      /*@editable*/text-decoration:underline;
    }
    #headerImage{
      height:auto;
      max-width:400px !important;
    }
  /*
  @tab Body
  @section body style
  @tip Set the background color for your email's body area.
  */
    #templateContainer,.bodyContent{
      /*@editable*/background-color:#FFFFFF;
    }
  /*
  @tab Body
  @section body text
  @tip Set the styling for your email's main content text. Choose a size and color that is easy to read.
  @theme main
  */
    .bodyContent div{
      /*@editable*/color:#505050;
      /*@editable*/font-family:Arial;
      /*@editable*/font-size:14px;
      /*@editable*/line-height:150%;
      /*@editable*/text-align:left;
    }
  /*
  @tab Body
  @section body link
  @tip Set the styling for your email's main content links. Choose a color that helps them stand out from your text.
  */
    .bodyContent div a:link,.bodyContent div a:visited,.bodyContent div a .yshortcuts {
      /*@editable*/color:#336699;
      /*@editable*/font-weight:normal;
      /*@editable*/text-decoration:underline;
    }
    .bodyContent img{
      display:inline;
      height:auto;
      margin-bottom:10px;
      max-width:280px;
    }
  /*
  @tab Footer
  @section footer style
  @tip Set the background color and top border for your email's footer area.
  @theme footer
  */
    #templateFooter{
      /*@editable*/background-color:#FFFFFF;
      /*@editable*/border-top:0;
    }
  /*
  @tab Footer
  @section footer text
  @tip Set the styling for your email's footer text. Choose a size and color that is easy to read.
  @theme footer
  */
    .footerContent {
      background-color: #fafafa;
    }
    .footerContent div{
      /*@editable*/color:#707070;
      /*@editable*/font-family:Arial;
      /*@editable*/font-size:11px;
      /*@editable*/line-height:150%;
      /*@editable*/text-align:left;
    }
  /*
  @tab Footer
  @section footer link
  @tip Set the styling for your email's footer links. Choose a color that helps them stand out from your text.
  */
    .footerContent div a:link,.footerContent div a:visited,.footerContent div a .yshortcuts {
      /*@editable*/color:#336699;
      /*@editable*/font-weight:normal;
      /*@editable*/text-decoration:underline;
    }
    .footerContent img{
      display:inline;
    }
  /*
  @tab Footer
  @section social bar style
  @tip Set the background color and border for your email's footer social bar.
  @theme footer
  */
    #social{
      /*@editable*/background-color:#FAFAFA;
      /*@editable*/border:0;
    }
  /*
  @tab Footer
  @section social bar style
  @tip Set the background color and border for your email's footer social bar.
  */
    #social div{
      /*@editable*/text-align:left;
    }
  /*
  @tab Footer
  @section utility bar style
  @tip Set the background color and border for your email's footer utility bar.
  @theme footer
  */
    #utility{
      /*@editable*/background-color:#FFFFFF;
      /*@editable*/border:0;
    }
  /*
  @tab Footer
  @section utility bar style
  @tip Set the background color and border for your email's footer utility bar.
  */
    #utility div{
      /*@editable*/text-align:left;
    }
    #monkeyRewards img{
      display:inline;
      height:auto;
      max-width:280px;
    }


  /*
  ATAVIST CUSTOM STYLES 
   */

  .buttonText {
    color: #4A90E2;
    text-decoration: none;
    font-weight: normal;
    display: block;
    border: 2px solid #585858;
    padding: 10px 80px;
    font-family: Arial;
  }

  #supportSection, .supportContent {
    background-color: white;
    font-family: arial;
    font-size: 12px;
    border-top: 1px solid #e4e4e4;
  }

  .bodyContent table {
    padding-bottom: 10px;
  }


  .footerContent p {
    margin: 0;
    margin-top: 2px;
  }

  .headerContent.centeredWithBackground {
    background-color: #F4EEE2;
    text-align: center;
    padding-top: 20px;
    padding-bottom: 20px;
  }
      
   @media only screen and (min-device-width: 320px) and (max-device-width: 480px) {
          h1 {
              font-size: 40px !important;
          }
          
          .content {
              font-size: 22px !important;
          }
          
          .bodyContent p {
              font-size: 22px !important;
          }
          
          .buttonText {
              font-size: 22px !important;
          }
          
          p {
              
              font-size: 16px !important;
              
          }
          
          .footerContent p {
              padding-left: 5px !important;
          }
          
          .mainContainer {
              padding-bottom: 0 !important;   
          }
      }
    </style>
        
        `,
    });

    res.status(200).json({
      success: true,
      message: "reset link sent to email",
    });
    // console.log(url)
    // console.log(user)
  } catch (err) {
    res.status(200).json({
      success: false,
    });
  }
});

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { newPassword, newConfirmPassword } = req.body;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+password");
  // console.log(user)

  if (!user) {
    return res.status(201).json({
      message: "tokenExpired",
    });
  }

  if (!newPassword) {
    return res.status(400).send({
      newPassword: "Please enter new password",
    });
  }

  if (!newConfirmPassword) {
    return res.status(400).send({
      newConfirmPassword: "Please confirm your password",
    });
  }

  if (newPassword != newConfirmPassword) {
    return res.status(400).send({
      newConfirmPassword: "Confirm password is not matched",
    });
  }

  // Setup new password
  user.password = newPassword;

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  const activitylogs = await ActivityLogs.create({
    user_id: user._id,
    description: "Reset the password"
  });

  console.log(activitylogs)

  await user.save();

  const token = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  // console.log(token);

  return res.json({ token, user });
});

exports.profileEdit = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  const health = await Health.find();
  const health_user = await User.findById(id).populate("health_id");
  const checkhealth_user = health_user.health_id;

  const activitylogs = await ActivityLogs.create({
    user_id: user_idss,
    description: "View the profile"
  });

  console.log(activitylogs)

  res.json({ user, health, checkhealth_user });
});

// For Verify Account
exports.profileUpdate = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const {
    first_name,
    middle_name,
    last_name,
    age,
    birth_date,
    house_purok_no,
    street,
    barangay,
    gender,
    confirm,
    health_id,
  } = req.body;

  const profile_picture = req.files?.profile_picture;

  // console.log("hi");
  const valid_id = req.files?.valid_id;

  if (age < 60) {
    return res.status(400).send({
      birth_date: "Birth date is not valid.",
      age: "Age must be 60 or above. ",
    });
  }

  const userss = await User.findByIdAndUpdate(
    id,
    {
      $unset: { health_id: "" },
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  if (!first_name || first_name === "undefined") {
    return res.status(400).send({
      first_name: "Please enter your first_name",
    });
  }

  if (!middle_name || middle_name === "undefined") {
    return res.status(400).send({
      middle_name: "Please enter your middle_name",
    });
  }

  if (!last_name || last_name === "undefined") {
    return res.status(400).send({
      last_name: "Please enter your last_name",
    });
  }

  if (!birth_date || birth_date === "undefined") {
    return res.status(400).send({
      birth_date: "Please enter your birth_date",
    });
  }

  if (!age || age === "undefined") {
    return res.status(400).send({
      age: "Please enter your age",
    });
  }

  if (!gender || gender === "undefined") {
    return res.status(400).send({
      gender: "Please enter your gender",
    });
  }

  if (!house_purok_no || house_purok_no === "undefined") {
    return res.status(400).send({
      house_purok_no: "Please enter your house_purok_no",
    });
  }

  if (!street || street === "undefined") {
    return res.status(400).send({
      street: "Please enter your street",
    });
  }

  if (!barangay || barangay === "undefined") {
    return res.status(400).send({
      barangay: "Please enter your barangay",
    });
  }

  if (!barangay || barangay === "undefined") {
    return res.status(400).send({
      barangay: "Please enter your barangay",
    });
  }

  if (!profile_picture || profile_picture === "undefined") {
    return res.status(400).send({
      profile_picture: "Please upload your new profile picture",
    });
  }

  if (!valid_id || valid_id === "undefined") {
    return res.status(400).send({
      valid_id: "Please upload your valid id",
    });
  }

  if (confirm === "false") {
    return res.status(400).send({
      confirm: "Please check this box if you want to proceed",
    });
  }

  const newUserData = {
    first_name: first_name,
    middle_name: middle_name,
    last_name: last_name,
    age: age,
    birth_date: birth_date,
    address: {
      house_purok_no: house_purok_no,
      street: street,
      barangay: barangay,
    },
    gender: gender,
    health_id: health_id,
    account_verified: "pending",
  };

  if (profile_picture) {
    // const result = await cloudinary.v2.uploader.upload(profile_picture, {
    //     folder: 'profile_picture',
    // })

    // newUserData.profile_picture = {
    //     public_id: result.public_id,
    //     url: result.secure_url
    // }

    //============= upload newww LARGE FILE
    function bufferToStream(buffer) {
      var stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      return stream;
    }
    const response = await drive.files.create({
      requestBody: {
        parents: ["1Txj-XKNoGgfYkeuqojY_Bjzh8qkqDDJ_"],
        name: profile_picture.name,
      },
      media: {
        body: bufferToStream(profile_picture.data),
      },
    });

    const fileId = response.data.id;

    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    //============= upload newww BASE64

    // const uploadImg = profile_picture.split(/,(.+)/)[1];
    // const buf = new Buffer.from(uploadImg, "base64"); // Added
    // const bs = new stream.PassThrough(); // Added
    // bs.end(buf); // Added

    // const response = await drive.files.create({
    //   requestBody: {
    //     'parents':  ['1Txj-XKNoGgfYkeuqojY_Bjzh8qkqDDJ_'],
    //   },
    //   media: {
    //     body: bs,
    //   },
    // });
    // const fileId = response.data.id;

    // await drive.permissions.create({
    //   fileId: fileId,
    //   requestBody: {
    //     role: 'reader',
    //     type: 'anyone',
    //   },
    // });
    // const result2 = await drive.files.get({
    //   fileId: fileId,
    //   fields: 'webViewLink, webContentLink',
    // });

    newUserData.profile_picture = {
      public_id: fileId,
      url: `https://drive.google.com/uc?export=view&id=${fileId}`,
    };
  }

  if (valid_id) {
    // const result = await cloudinary.v2.uploader.upload(profile_picture, {
    //     folder: 'profile_picture',
    // })

    // newUserData.profile_picture = {
    //     public_id: result.public_id,
    //     url: result.secure_url
    // }

    //============= upload newww LARGE FILE
    function bufferToStream(buffer) {
      var stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      return stream;
    }
    const response = await drive.files.create({
      requestBody: {
        parents: ["1Txj-XKNoGgfYkeuqojY_Bjzh8qkqDDJ_"],
        name: valid_id.name,
      },
      media: {
        body: bufferToStream(valid_id.data),
      },
    });

    const fileId = response.data.id;

    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    //============= upload newww BASE64

    // const uploadImg = profile_picture.split(/,(.+)/)[1];
    // const buf = new Buffer.from(uploadImg, "base64"); // Added
    // const bs = new stream.PassThrough(); // Added
    // bs.end(buf); // Added

    // const response = await drive.files.create({
    //   requestBody: {
    //     'parents':  ['1Txj-XKNoGgfYkeuqojY_Bjzh8qkqDDJ_'],
    //   },
    //   media: {
    //     body: bs,
    //   },
    // });
    // const fileId = response.data.id;

    // await drive.permissions.create({
    //   fileId: fileId,
    //   requestBody: {
    //     role: 'reader',
    //     type: 'anyone',
    //   },
    // });
    // const result2 = await drive.files.get({
    //   fileId: fileId,
    //   fields: 'webViewLink, webContentLink',
    // });

    newUserData.valid_id = {
      public_id: fileId,
      url: `https://drive.google.com/uc?export=view&id=${fileId}`,
    };
  }

  const user = await User.findByIdAndUpdate(id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  //  console.log(newUserData)

  const activitylogs = await ActivityLogs.create({
    user_id: user._id,
    description: "Updated the profile"
  });

  console.log(activitylogs)

  return res.status(200).json({
    success: true,
    message: "success",
  });
});

// personal update
exports.profileUpdateSubmit = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const {
    first_name,
    middle_name,
    last_name,
    age,
    birth_date,
    house_purok_no,
    street,
    barangay,
    gender,
  } = req.body;

  // if (age < 60) {
  //   return res.status(400).send({
  //     birth_date: "Birth date is not valid.",
  //     age: "Age must be 60 or above. ",
  //   });
  // }

  const profile_picture = req.files?.profile_picture;

  // console.log("hi");
  const valid_id = req.files?.valid_id;

  if (!first_name || first_name === "undefined") {
    return res.status(400).send({
      first_name: "Please enter your first_name",
    });
  }

  if (!middle_name || middle_name === "undefined") {
    return res.status(400).send({
      middle_name: "Please enter your middle_name",
    });
  }

  if (!last_name || last_name === "undefined") {
    return res.status(400).send({
      last_name: "Please enter your last_name",
    });
  }

  if (!birth_date || birth_date === "undefined") {
    return res.status(400).send({
      birth_date: "Please enter your birth_date",
    });
  }

  if (!age || age === "undefined") {
    return res.status(400).send({
      age: "Please enter your age",
    });
  }

  if (!gender || gender === "undefined") {
    return res.status(400).send({
      gender: "Please enter your gender",
    });
  }

  if (!house_purok_no || house_purok_no === "undefined") {
    return res.status(400).send({
      house_purok_no: "Please enter your house_purok_no",
    });
  }

  if (!street || street === "undefined") {
    return res.status(400).send({
      street: "Please enter your street",
    });
  }

  if (!barangay || barangay === "undefined") {
    return res.status(400).send({
      barangay: "Please enter your barangay",
    });
  }

  const newUserData = {
    first_name: first_name,
    middle_name: middle_name,
    last_name: last_name,
    age: age,
    birth_date: birth_date,
    address: {
      house_purok_no: house_purok_no,
      street: street,
      barangay: barangay,
    },
    gender: gender,
  };

  if (profile_picture) {
    // //delete last picture
    // const user = await User.findById(id);
    // const image_id = user.profile_picture.public_id;
    // const responsedelete = await drive.files.delete({
    //   fileId: image_id,
    // });

    //============= upload newww LARGE FILE
    function bufferToStream(buffer) {
      var stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      return stream;
    }
    const response = await drive.files.create({
      requestBody: {
        parents: ["1Txj-XKNoGgfYkeuqojY_Bjzh8qkqDDJ_"],
        name: profile_picture.name,
      },
      media: {
        body: bufferToStream(profile_picture.data),
      },
    });
    // console.log(bufferToStream(profile_picture.data));
    const fileId = response.data.id;

    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    newUserData.profile_picture = {
      public_id: fileId,
      url: `https://drive.google.com/uc?export=view&id=${fileId}`,
    };
  }

  if (valid_id) {
    //delete last picture
    // const user = await User.findById(id);
    // const image_id = user.valid_id.public_id;
    // if(image_id){
    //   const responsedelete = await drive.files.delete({
    //     fileId: image_id,
    //   });
    // }

    //============= upload newww LARGE FILE
    function bufferToStream(buffer) {
      var stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      return stream;
    }
    const response = await drive.files.create({
      requestBody: {
        parents: ["1Txj-XKNoGgfYkeuqojY_Bjzh8qkqDDJ_"],
        name: valid_id.name,
      },
      media: {
        body: bufferToStream(valid_id.data),
      },
    });
    // console.log(bufferToStream(valid_id.data));
    const fileId = response.data.id;

    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    newUserData.valid_id = {
      public_id: fileId,
      url: `https://drive.google.com/uc?export=view&id=${fileId}`,
    };
  }

  const user = await User.findByIdAndUpdate(id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  const activitylogs = await ActivityLogs.create({
    user_id: user._id,
    description: "Updated the profile - personal information"
  });

  console.log(activitylogs)

  return res.status(200).json({
    success: true,
    message: "success",
  });
});

exports.profileupdateCredential = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { user_name, phone, email, oldPassword, newPassword, confirmPassword } =
    req.body;

  // console.log(id, user_name,phone,email,oldPassword, newPassword, confirmPassword)

  const user = await User.findById(id).select("+password");

  const emails = await User.find({ email: { $ne: user.email } }).exec();
  const usernames = await User.find({
    user_name: { $ne: user.user_name },
  }).exec();

  var userAllEmail = emails.map(function (emailsss) {
    return emailsss.email;
  });
  var userAllUsername = usernames.map(function (usernamessss) {
    return usernamessss.user_name;
  });

  if (user.email !== email) {
    if (email == userAllEmail) {
      return res.status(400).send({
        email: "Email is already in use.",
      });
    }
  }

  if (user.user_name !== user_name) {
    if (user_name == userAllUsername) {
      return res.status(400).send({
        user_name: "User_name is already in use.",
      });
    }
  }

  if (oldPassword !== "undefined") {
    const isMatched = await user.comparePassword(oldPassword);

    if (!isMatched) {
      return res.status(400).send({
        oldPassword: "Old password is incorrect",
      });
    } else if (newPassword == "undefined") {
      return res.status(400).send({
        newPassword: "Please enter new password",
      });
    } else if (confirmPassword == "undefined") {
      return res.status(400).send({
        confirmPassword: "Please enter confirmPassword",
      });
    } else if (newPassword != confirmPassword) {
      return res.status(400).send({
        confirmPassword: "Confirm password is not matched",
      });
    } else {
      user.password = newPassword;
      await user.save();

      const newUserDatass = {
        user_name: user_name,
        email: email,
        phone: phone,
      };

      await User.findByIdAndUpdate(id, newUserDatass, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      });
    }
  }

  if (phone !== "undefined") {
    const newUserDatas = {
      user_name: user_name,
      email: email,
      phone: phone,
    };

    await User.findByIdAndUpdate(id, newUserDatas, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
  }

  const newUserData = {
    user_name: user_name,
    email: email,
  };

  await User.findByIdAndUpdate(id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  const activitylogs = await ActivityLogs.create({
    user_id: user._id,
    description: "Updated the profile - credential"
  });

  console.log(activitylogs)

  return res.status(200).json({
    success: true,
    message: "success",
  });
});

exports.profileUpdateHealth = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!req.files) {
    const userss = await User.findByIdAndUpdate(
      id,
      {
        $unset: { health_id: "", requirement_id: " " },
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    const user = await User.findByIdAndUpdate(
      id,
      {
        health_id: req.body.health_id,
        requirement_id: req.body.requirement_id,
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    // console.log(req.body.health_id)
    return res.status(200).json({
      success: true,
      message: "success",
    });
  } else {
    const { medical_certificate } = req.files;

    console.log(medical_certificate);

    const userss = await User.findByIdAndUpdate(
      id,
      {
        $unset: { health_id: "" },
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    const user = await User.findByIdAndUpdate(
      id,
      { health_id: req.body.health_id },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    //============= upload newww LARGE FILE
    function bufferToStream(buffer) {
      var stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      return stream;
    }
    const response = await drive.files.create({
      requestBody: {
        parents: ["1Txj-XKNoGgfYkeuqojY_Bjzh8qkqDDJ_"],
        name: medical_certificate.name,
      },
      media: {
        body: bufferToStream(medical_certificate.data),
      },
    });

    const fileId = response.data.id;

    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const userMedical_certificate = await User.findByIdAndUpdate(
      id,
      {
        medical_certificate: {
          public_id: fileId,
          url: `https://drive.google.com/uc?export=view&id=${fileId}`,
        },
      },
      {
        new: true,
        runValidators: true,
        useFindandModify: false,
      }
    );

    const activitylogs = await ActivityLogs.create({
      user_id: user._id,
      description: "Updated the profile - health information"
    });
  
    console.log(activitylogs)

    // console.log(req.body.health_id)
    return res.status(200).json({
      success: true,
      message: "success",
    });
  }
});

//////========================= Accept attendees

exports.acceptAttendees = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  console.log(id);

  const user = await Schedule.findByIdAndUpdate(
    id,
    { status: "attended" },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  return res.status(200).json({
    success: true,
  });
});

exports.QRacceptAttendees = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const str = id.slice(1, -1);
  const mongoose = require("mongoose");

  const user = await Schedule.findByIdAndUpdate(
    mongoose.Types.ObjectId(str),
    { status: "attended" },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  return res.status(200).json({
    success: true,
  });
});

//////========================= admin User CRUD

exports.read = catchAsyncErrors(async (req, res, next) => {
  const user = await User.find();

  // console.log(user)
  res.json({ user });
});
