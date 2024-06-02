require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require('path');
const basicAuth = require('basic-auth');

const app = express();
const port = 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Basic authentication middleware
const auth = (req, res, next) => {
  const user = basicAuth(req);
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!user || user.name !== adminUsername || user.pass !== adminPassword) {
    res.set('WWW-Authenticate', 'Basic realm="example"');
    return res.status(401).send('Authentication required.');
  }
  next();
};

// Apply the authentication middleware to all routes
app.use(auth);

// Function to upload file to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'uploads' },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// Route to upload an image
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const result = await uploadToCloudinary(req.file.buffer);
    res.status(200).send({
      message: 'File uploaded successfully.',
      fileUrl: result.secure_url,
    });
  } catch (error) {
    res.status(500).send({
      message: 'Failed to upload image.',
      error: error.message,
    });
  }
});

// Route to fetch images from the folder
app.get('/images', async (req, res) => {
  try {
    const { resources } = await cloudinary.search
      .expression('folder:uploads')
      .sort_by('public_id', 'desc')
      .max_results(30)
      .execute();

    const imageUrls = resources.map((file) => file.secure_url);
    res.status(200).send(imageUrls);
  } catch (error) {
    res.status(500).send({
      message: 'Failed to fetch images.',
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
