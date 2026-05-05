import { NextRequest, NextResponse } from "next/server";

const GIPHY_BASE = "https://api.giphy.com/v1/gifs";

export async function GET(req: NextRequest) {
  const API_KEY = process.env.GIPHY_API_KEY;
  if (!API_KEY) return NextResponse.json({ data: [] }, { status: 500 });

  const q = req.nextUrl.searchParams.get("q")?.slice(0, 100) ?? null;
  const limit = "20";

  const endpoint = q
    ? `${GIPHY_BASE}/search?api_key=${API_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&rating=g`
    : `${GIPHY_BASE}/trending?api_key=${API_KEY}&limit=${limit}&rating=g`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) return NextResponse.json({ data: [] }, { status: res.status });
    const json = await res.json();
    return NextResponse.json({ data: json.data });
  } catch {
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
