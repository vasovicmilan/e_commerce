import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

// Postavi statičku putanju do ffmpeg-a
ffmpeg.setFfmpegPath(ffmpegStatic);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_PATH = path.join(__dirname, "..", "public");

// Osiguraj foldere
await fs.ensureDir(path.join(PUBLIC_PATH, "images", "items"));
await fs.ensureDir(path.join(PUBLIC_PATH, "images", "categories"));
await fs.ensureDir(path.join(PUBLIC_PATH, "images", "posts"));
await fs.ensureDir(path.join(PUBLIC_PATH, "images", "testimonials"));
await fs.ensureDir(path.join(PUBLIC_PATH, "images", "partners"));
await fs.ensureDir(path.join(PUBLIC_PATH, "images", "site"));
await fs.ensureDir(path.join(PUBLIC_PATH, "videos"));
await fs.ensureDir(path.join(PUBLIC_PATH, "videos", "thumbnails"));

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getDestination(fieldname) {
  const map = {
    featureImage: "items",
    variationImage: "items",
    categoryImage: "categories",
    postImage: "posts",
    contentImage: "posts",
    testimonialImage: "testimonials",
    partnerLogo: "partners",
    siteImage: "site",
    video: "videos",
  };

  const subfolder = map[fieldname] || "items";
  return path.join(PUBLIC_PATH, "images", subfolder);
}

function generateFilename(originalname) {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(originalname).toLowerCase();
  const base = path.basename(originalname, ext)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "") || "file";

  return `${base}-${uniqueSuffix}`;
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const field = file.fieldname;

  if (field === "video" || field === "vid") {
    if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Video polje prima samo: ${ALLOWED_VIDEO_TYPES.join(", ")}`), false);
    }
  } else if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Dozvoljeni formati: ${ALLOWED_IMAGE_TYPES.join(", ")}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 20,
  },
});

// =============== SLIKE (Sharp) ===============

const WEBP_OPTIONS = {
  items: [
    { suffix: "thumb", width: 150, height: 150, fit: "cover" },
    { suffix: "medium", width: 600, height: 600, fit: "inside" },
    { suffix: "original", width: 1920, height: 1920, fit: "inside", withoutEnlargement: true },
  ],
  categories: [
    { suffix: "thumb", width: 150, height: 150, fit: "cover" },
    { suffix: "medium", width: 600, height: 400, fit: "cover" },
  ],
  posts: [
    { suffix: "thumb", width: 150, height: 150, fit: "cover" },
    { suffix: "medium", width: 800, height: 450, fit: "cover" },
  ],
  testimonials: [
    { suffix: "thumb", width: 100, height: 100, fit: "cover" },
  ],
  partners: [
    { suffix: "thumb", width: 150, height: 150, fit: "cover" },
    { suffix: "medium", width: 300, height: 300, fit: "inside" },
  ],
  site: [
    { suffix: "original", width: 1920, height: 1080, fit: "inside" },
  ],
};

async function convertAndSave(buffer, destination, baseFilename, type = "items") {
  const sizes = WEBP_OPTIONS[type] || WEBP_OPTIONS.items;
  const savedFiles = {};

  for (const size of sizes) {
    const outputFilename = `${baseFilename}-${size.suffix}.webp`;
    const outputPath = path.join(destination, outputFilename);

    await sharp(buffer)
      .resize(size.width, size.height, { fit: size.fit, withoutEnlargement: size.withoutEnlargement || false })
      .webp({ quality: 80 })
      .toFile(outputPath);

    savedFiles[size.suffix] = outputFilename;
  }

  return savedFiles;
}

async function handleImageUpload(file, destination, type) {
  const baseFilename = generateFilename(file.originalname);
  const savedFiles = await convertAndSave(file.buffer, destination, baseFilename, type);

  return {
    img: savedFiles.medium || savedFiles.original || savedFiles.thumb,
    imgThumb: savedFiles.thumb || null,
    imgMedium: savedFiles.medium || null,
    imgOriginal: savedFiles.original || null,
    imgDesc: "",
  };
}

// =============== VIDEO (ffmpeg) ===============

async function processVideo(buffer, baseFilename) {
  const videoDir = path.join(PUBLIC_PATH, "videos");
  const thumbDir = path.join(PUBLIC_PATH, "videos", "thumbnails");

  // Čuvaj originalni video
  const videoFilename = `${baseFilename}.mp4`;
  const videoPath = path.join(videoDir, videoFilename);
  await fs.writeFile(videoPath, buffer);

  // Generiši thumbnail (prvi frejm, 320x180, webp)
  const thumbFilename = `${baseFilename}-thumb.webp`;
  const thumbPath = path.join(thumbDir, thumbFilename);

  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        count: 1,
        folder: thumbDir,
        filename: thumbFilename,
        size: "320x180",
        quality: 80,
      })
      .on("end", resolve)
      .on("error", reject);
  });

  // Opciono: kompresija videa (manja veličina, H.264)
  const compressedFilename = `${baseFilename}-compressed.mp4`;
  const compressedPath = path.join(videoDir, compressedFilename);

  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        "-c:v libx264",
        "-preset fast",
        "-crf 28",
        "-c:a aac",
        "-b:a 128k",
      ])
      .save(compressedPath)
      .on("end", resolve)
      .on("error", reject);
  });

  // Obriši original (jer imamo kompresovanu verziju)
  await fs.unlink(videoPath);

  return {
    vid: compressedFilename,
    thumbnail: thumbFilename,
    vidDesc: "",
  };
}

// =============== PROCESIRANJE ===============

function processUpload(fieldName, type = "items") {
  return [
    upload.single(fieldName),
    async (req, res, next) => {
      try {
        if (!req.file) return next();

        const destination = getDestination(fieldName);
        const isVideo = ALLOWED_VIDEO_TYPES.includes(req.file.mimetype);

        if (isVideo) {
          const baseFilename = generateFilename(req.file.originalname);
          const result = await processVideo(req.file.buffer, baseFilename);
          req.uploadedFile = result;
        } else {
          const result = await handleImageUpload(req.file, destination, type);
          req.uploadedFile = result;
        }

        next();
      } catch (error) {
        next(error);
      }
    },
  ];
}

function processMultipleUploads(fieldsConfig = []) {
  const multerFields = fieldsConfig.map((f) => ({ name: f.name, maxCount: f.maxCount || 1 }));

  return [
    upload.fields(multerFields),
    async (req, res, next) => {
      try {
        if (!req.files || Object.keys(req.files).length === 0) return next();

        req.uploadedFiles = {};

        for (const config of fieldsConfig) {
          const files = req.files[config.name];
          if (!files || files.length === 0) continue;

          const destination = getDestination(config.name);
          const type = config.type || "items";

          if (files.length === 1) {
            const file = files[0];
            const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);

            if (isVideo) {
              const baseFilename = generateFilename(file.originalname);
              const result = await processVideo(file.buffer, baseFilename);
              req.uploadedFiles[config.name] = result;
            } else {
              req.uploadedFiles[config.name] = await handleImageUpload(file, destination, type);
            }
          } else {
            const results = [];
            for (const file of files) {
              const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
              if (isVideo) {
                const baseFilename = generateFilename(file.originalname);
                results.push(await processVideo(file.buffer, baseFilename));
              } else {
                results.push(await handleImageUpload(file, destination, type));
              }
            }
            req.uploadedFiles[config.name] = results;
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    },
  ];
}

export default upload;
export { processUpload, processMultipleUploads, getDestination };