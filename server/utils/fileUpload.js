import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Recreate __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const uploadFile = async (file, type) => {
  const uploadsDir = path.join(__dirname, "../../uploads");
  const fileExtension = path.extname(file.name).toLowerCase();
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = path.join(uploadsDir, fileName);

  const allowedTypes = {
    document: [".pdf", ".doc", ".docx", ".txt"],
    video: [".mp4", ".avi", ".mov", ".wmv"],
    image: [".jpg", ".jpeg", ".png", ".gif"],
    audio: [".mp3", ".wav", ".ogg"],
    other: null,
  };

  if (
    type !== "other" &&
    allowedTypes[type] &&
    !allowedTypes[type].includes(fileExtension)
  ) {
    throw new Error(`Invalid file type for ${type}`);
  }

  await fs.mkdir(uploadsDir, { recursive: true });
  await file.mv(filePath);

  return {
    url: `/uploads/${fileName}`,
    fileName: file.name,
    fileSize: file.size,
  };
};
