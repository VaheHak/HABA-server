const multer = require("multer");
const HttpErrors = require('http-errors');

module.exports = (allowedMimes) => {
  const fileFilter = (req, file, cb) => {
    if (Object.keys(allowedMimes).includes(file.mimetype)){
      cb(null, true);
    } else{
      cb(HttpErrors(422, {errors: {image: 'Image format must be png, jpg, webp'}}), false);
    }
  };
  const storage = multer.memoryStorage(
    {
      onError: (err, next) => {
        next(err);
      },
    },
  );
  return multer(
    {
      storage,
      limits: {fileSize: +5 * 1024 * 1024},
      fileFilter,
    },
  );
};
