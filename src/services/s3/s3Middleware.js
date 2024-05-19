const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");

//config files
const { AWS_CONFIG } = require("../../config/config");

const s3 = new S3Client({
  region: AWS_CONFIG.region,
  credentials: {
    accessKeyId: AWS_CONFIG.accessKeyId,
    secretAccessKey: AWS_CONFIG.secretAccessKey,
  },
});

const storageS3 = multerS3({
  s3: s3,
  bucket: AWS_CONFIG.AWS_S3_BUCKET_NAME,
  contentDisposition: "inline",
  contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically set Content-Type based on file extension
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },

  acl: "public-read",
  key: function (req, file, callback) {
    callback(null, `${file.fieldname +"/" + file.originalname + new Date().getTime()}`);
  },
});

const uploadS3Middleware = multer({
  storage: storageS3,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
    fieldSize: 2 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    // Check if the file is an image
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed!"), false);
    }
  },
});

// Custom middleware to directly return req.file
const getFileMiddleware = (fieldName) => (req, res, next) => {
  uploadS3Middleware.single(fieldName)(req, res, (err) => {
    if (err?.message) {
      return res.status(400).json({ message: err.message, err });
    }

    // Add req.file to the request object
    req.file = req.file;

    next();
  });
};

const validateEventImagesMiddleware = (fieldNamePrimary, fieldNameSecondary) => (req, res, next) => {
  uploadS3Middleware.fields([
    { name: fieldNamePrimary,maxCount:1},
    { name: fieldNameSecondary, maxCount : 10 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message, err });
    }

    const { files } = req;

    let primaryImages = files[fieldNamePrimary] || [];
    let secondaryImages = files[fieldNameSecondary] || [];

    if (primaryImages.length < 1 && !req.originalUrl.includes("/events/edit")) {
      return res
        .status(400)
        .json({ message: "At least one primary image is required." });
    }

    primaryImages = primaryImages?.map(images=>images?.location);
    secondaryImages = secondaryImages?.map(images=>images?.location)
    req.files = { primaryImages, secondaryImages };
    next();
  });
};




module.exports = { getFileMiddleware,validateEventImagesMiddleware };
