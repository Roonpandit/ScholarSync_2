import { cloudinary } from 'scholarsync-backend-common';

const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        quality: 'auto:best',
        fetch_format: 'auto',
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' },
          { quality: 'auto:best' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(file.buffer);
  });
};

export { uploadToCloudinary };
