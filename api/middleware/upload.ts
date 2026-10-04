import path from "path";
import fs from "fs/promises";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB limit per file
    files: 5, // Maximum 5 files per message
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const allowedImageExts = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif', 'svg'];
    const allowedDocExts = ['pdf', 'docx', 'doc', 'txt', 'csv', 'xls', 'xlsx', 'ppt', 'pptx', 'zip'];
    const allowedAudioExts = ['mp3', 'wav', 'm4a', 'webm', 'ogg'];
    const allowedVideoExts = ['mp4', 'mov', 'avi', 'mkv'];

    const isImage = allowedImageExts.includes(ext) || /^image\//.test(file.mimetype);
    const isDoc = allowedDocExts.includes(ext) ||
      file.mimetype === "application/pdf" ||
      file.mimetype === "text/plain" ||
      file.mimetype === "text/csv" ||
      file.mimetype === "application/csv" ||
      file.mimetype === "application/msword" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/zip";
    const isAudio = allowedAudioExts.includes(ext) || /^audio\//.test(file.mimetype);
    const isVideo = allowedVideoExts.includes(ext) || /^video\//.test(file.mimetype);

    if (isImage || isDoc || isAudio || isVideo) {
      cb(null, true);
      return;
    }

    cb(new Error("This file type is not supported. Only images, documents, audio, and videos (MP4, MOV, AVI, MKV) are allowed."));
  },
});

export const uploadFilesToCloudinary = async (
  files: Express.Multer.File[] = []
) => {
  if (!files.length) {
    return [];
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  const isCloudinaryValid = Boolean(
    cloudName &&
    cloudName !== 'Root' &&
    cloudName !== 'your_cloud_name' &&
    apiKey &&
    apiSecret
  );

  if (isCloudinaryValid) {
    try {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    } catch (e) {
      // Ignore config error
    }
  }

  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (e) {
    // Dir exists or creation failed
  }

  return Promise.all(
    files.map(async (file) => {
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      const isImage = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif', 'svg'].includes(ext) || /^image\//.test(file.mimetype);
      const isAudio = ['mp3', 'wav', 'm4a', 'webm', 'ogg'].includes(ext) || /^audio\//.test(file.mimetype);
      const isVideo = ['mp4', 'mov', 'avi', 'mkv'].includes(ext) || /^video\//.test(file.mimetype);

      const buffer = file.buffer || (file.path ? await fs.readFile(file.path) : Buffer.from(''));
      const dataUri = `data:${file.mimetype};base64,${buffer.toString("base64")}`;
      let url = dataUri;

      if (isCloudinaryValid) {
        try {
          const result = await cloudinary.uploader.upload(dataUri, {
            folder: "femcare-uploads",
            resource_type: isImage ? "image" : (isAudio || isVideo) ? "video" : "raw",
          });
          url = result.secure_url;
        } catch (err: any) {
          console.warn("⚠️ Cloudinary upload warning:", err?.message || err);
        }
      }

      // If Cloudinary didn't provide a remote http(s) URL, write to local static uploads folder
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        const safeExt = ext ? `.${ext}` : '';
        const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
        const filePath = path.join(uploadsDir, uniqueFilename);
        try {
          await fs.writeFile(filePath, buffer);
          url = `/uploads/${uniqueFilename}`;
        } catch (err) {
          console.error("⚠️ Failed to write local upload file:", err);
        }
      }

      return {
        url,
        dataUri,
        mimeType: file.mimetype,
        size: file.size,
        originalName: file.originalname,
        isImage,
        isAudio,
        isVideo,
      };
    })
  );
};

export default upload;
