import { Router } from "express";
import multer from "multer";
import { env } from "../config/env";
import { importFile, importJson } from "../controllers/import.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype === "text/plain" ||
      file.originalname.toLowerCase().endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .csv files are accepted"));
    }
  },
});

const router = Router();

router.post("/", importJson);
router.post("/file", upload.single("file"), importFile);

// Expose config for the frontend
router.get("/config", (_req, res) => {
  res.status(200).json({
    defaultBatchSize: env.DEFAULT_BATCH_SIZE,
    maxBatchSize: env.MAX_BATCH_SIZE,
    maxRowsPerRequest: env.MAX_ROWS_PER_REQUEST,
  });
});

export default router;
