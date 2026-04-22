import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import OpenAI from "openai";
import { toFile } from "openai/uploads";

dotenv.config();

// 회사망 SSL 검사 우회 테스트용
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "20mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (_req, res) => {
  res.send("서버 정상 실행 중");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/edit-image", upload.single("image"), async (req, res) => {
  console.log("POST /api/edit-image 들어옴");

  try {
    const prompt = req.body.prompt || "";
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "이미지 파일 없음" });
    }

    if (!prompt.trim()) {
      return res.status(400).json({ error: "프롬프트 없음" });
    }

    console.log("OpenAI 요청 직전");

    const uploadableImage = await toFile(
      file.buffer,
      file.originalname || "background.png",
      {
        type: file.mimetype || "image/png",
      }
    );

    const result = await client.images.edit({
      model: "gpt-image-1",
      image: uploadableImage,
      prompt,
      size: "1536x1024",
    });

    console.log("OpenAI 응답 받음");

    const outputBase64 = result.data?.[0]?.b64_json;

    if (!outputBase64) {
      return res.status(500).json({ error: "이미지 결과 없음" });
    }

    return res.json({
      image: outputBase64,
    });
  } catch (error) {
    console.error("edit-image error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        error?.error?.message ||
        "AI 이미지 편집 실패",
    });
  }
});

app.listen(3001, () => {
  console.log("서버 실행됨: http://localhost:3001");
});