const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../Config/Cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "jumia",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "mp4"],
    transformation: [
      {
        width: 500,
        height: 500,
        crop: "limit",
      },
    ],
  },
});

const upload = multer({
  storage: storage,
});

module.exports = upload;