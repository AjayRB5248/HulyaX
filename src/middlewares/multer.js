const multer = require("multer");

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

module.exports = {
  multerParser: formDataParserMiddleware(),
};
