const multer = require('multer');
const express = require('express');
const storage = multer.memoryStorage();

const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const path = require('path');
const app = express();

const fileFilter = (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Limiting file size to 5MB
    fileFilter: fileFilter
});

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        res.status(400).send('Error uploading file: ' + error.message);
    } else if (error) {
        res.status(400).send('Error: ' + error.message);
    } else {
        next();
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;

    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype
    };

    try {
        await s3.upload(params).promise();
        res.status(200).send('File uploaded to S3 successfully!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error uploading file to S3');
    }
});

app.listen(3000, () => {
    console.log("server is running on port 3000");
  });