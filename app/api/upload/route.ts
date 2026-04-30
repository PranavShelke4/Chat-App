import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { UploadResult } from "@/types";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/mov", "video/webm", "video/quicktime"];
const AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

function getMediaType(mime: string): "image" | "video" | "file" | "audio" {
  if (IMAGE_TYPES.includes(mime)) return "image";
  if (VIDEO_TYPES.includes(mime)) return "video";
  if (AUDIO_TYPES.includes(mime)) return "audio";
  return "file";
}

function getResourceType(mime: string): "image" | "video" | "raw" {
  if (IMAGE_TYPES.includes(mime)) return "image";
  if (VIDEO_TYPES.includes(mime) || AUDIO_TYPES.includes(mime)) return "video";
  return "raw";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const resourceType = getResourceType(file.type);
    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: resourceType,
      folder: "chatapp",
    });

    const mediaType = getMediaType(file.type);
    const response: UploadResult = {
      url: result.secure_url,
      type: mediaType,
      fileName: file.name,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[POST /api/upload]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
