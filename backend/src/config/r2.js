const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload a file to R2
 * @param {Buffer} fileBuffer - File data
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File MIME type
 * @returns {Promise<string>} - Public URL of uploaded file
 */
async function uploadToR2(fileBuffer, originalName, mimetype) {
  try {
    // Generate unique filename
    const fileExtension = path.extname(originalName);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
    const key = `uploads/${uniqueName}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimetype,
    });

    await r2Client.send(command);

    // Return public URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    return publicUrl;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error('Failed to upload file to R2');
  }
}

/**
 * Delete a file from R2
 * @param {string} fileUrl - Full URL of the file to delete
 * @returns {Promise<void>}
 */
async function deleteFromR2(fileUrl) {
  try {
    // Extract key from URL
    // URL format: https://pub-xxxxx.r2.dev/uploads/filename.jpg
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    console.log('Deleted from R2:', key);
  } catch (error) {
    console.error('R2 delete error:', error);
    // Don't throw - deletion failure shouldn't block the request
  }
}

module.exports = {
  uploadToR2,
  deleteFromR2,
};