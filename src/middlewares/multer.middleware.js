import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp'); // Adjust path as per your folder structure
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname); // Adding timestamp to prevent overwriting files
    }
});

const upload = multer({ storage: storage });

export { upload };
