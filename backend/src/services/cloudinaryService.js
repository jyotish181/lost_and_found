// src/services/cloudinaryService.js
// Provides methods for streaming image uploads, generating optimized URLs, and deleting assets.

const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");
const { Readable } = require("stream");

/**
 * Upload an in-memory buffer to Cloudinary using an upload stream.
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} folder - Destination folder in Cloudinary
 * @returns {Promise<{ imageUrl: string, publicId: string, secureUrl: string }>}
 */
const uploadImageBuffer = (buffer, folder = "lost-and-found") => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      // Fallback: If Cloudinary credentials are not configured,
      // create a data URI placeholder so development/testing works without blocking.
      const base64Data = buffer.toString("base64");
      const fallbackUrl = `data:image/jpeg;base64,${base64Data}`;
      return resolve({
        imageUrl: fallbackUrl,
        publicId: `local_${Date.now()}`,
        secureUrl: fallbackUrl,
        isFallback: true,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.warn(`Cloudinary upload failed (${error.message}). Falling back to local data URI.`);
          const base64Data = buffer.toString("base64");
          const fallbackUrl = `data:image/jpeg;base64,${base64Data}`;
          return resolve({
            imageUrl: fallbackUrl,
            publicId: `local_${Date.now()}`,
            secureUrl: fallbackUrl,
            isFallback: true,
          });
        }
        resolve({
          imageUrl: result.secure_url,
          publicId: result.public_id,
          secureUrl: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
        });
      }
    );

    // Stream the buffer into Cloudinary
    Readable.from(buffer).pipe(uploadStream);
  });
};

/**
 * Delete an image asset from Cloudinary.
 * @param {string} publicId
 */
const deleteImage = async (publicId) => {
  if (!publicId || publicId.startsWith("local_")) return;
  if (!isCloudinaryConfigured()) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.warn(`Failed to delete Cloudinary asset (${publicId}): ${error.message}`);
  }
};

/**
 * Generate optimized Cloudinary transformation URLs.
 * @param {string} publicId
 * @param {'thumbnail' | 'detail' | 'card'} variant
 */
const getOptimizedUrl = (publicId, variant = "detail") => {
  if (!publicId || !isCloudinaryConfigured() || publicId.startsWith("local_")) {
    return null;
  }

  const transformations = {
    thumbnail: { width: 300, height: 300, crop: "fill", gravity: "auto", quality: "auto", fetch_format: "auto" },
    card: { width: 500, height: 350, crop: "fill", gravity: "auto", quality: "auto", fetch_format: "auto" },
    detail: { width: 900, crop: "limit", quality: "auto", fetch_format: "auto" },
  };

  const options = transformations[variant] || transformations.detail;
  return cloudinary.url(publicId, options);
};

module.exports = {
  uploadImageBuffer,
  deleteImage,
  getOptimizedUrl,
};
