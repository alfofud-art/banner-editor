process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import express from "express";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ limit: "300mb", extended: true }));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => {
  res.send("Cloudinary 서버 정상 작동 중!");
});

app.get("/api/ping", (req, res) => {
  res.json({ ok: true, message: "프론트-서버 연결 성공" });
});

app.post("/api/remove-bg", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "imageUrl이 없습니다.",
      });
    }

    console.log("이미지 받는 중...");

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({
        success: false,
        message: ".env의 Cloudinary 값이 비어 있습니다.",
      });
    }

    const result = await cloudinary.uploader.upload(imageUrl, {
      background_removal: "cloudinary_ai",
    });

    console.log("배경 제거 요청 성공:", result.secure_url);

    res.json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    console.error("❌ Cloudinary 에러:", error);

    res.status(500).json({
      success: false,
      message: error?.message || "Cloudinary 배경 제거 중 오류 발생",
    });
  }
});

app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번에서 아주 잘 돌아가고 있어요!`);
});
