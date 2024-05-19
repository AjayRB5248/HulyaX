const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Function to create multer middleware with desired configuration
const createFormDataParser = () => {
  const storage = multer.memoryStorage(); // Use memory storage for simplicity
  return multer({ storage: storage });
};

// Middleware function to handle form data parsing
const formDataParserMiddleware = () => {
  const formDataParser = createFormDataParser();

  return (req, res, next) => {
    formDataParser.none()(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: "Invalid form data" });
      }
      next();
    });
  };
};

const formDataAndImageParserMiddleware = () => {
  const parser = createFormDataParser();

  return (req, res, next) => {
    parser.fields([{ name: "image", maxCount: 1 }, { name: "formData" }])(
      req,
      res,
      (err) => {
        if (err) {
          return res.status(400).json({ error: "Invalid form data or image" });
        }
        next();
      }
    );
  };
};

module.exports = {
  multerParser: formDataParserMiddleware(),
  formDataAndImageParserMiddleware: formDataAndImageParserMiddleware(),
};
