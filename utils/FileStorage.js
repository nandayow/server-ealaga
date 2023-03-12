const multer = require("multer");

//SET Storage
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.replace(" ", "-");
    cb(null, fileName + "-" + Date.now());
  },
});
const uploadOptions = multer({ storage });

module.exports = { uploadOptions };