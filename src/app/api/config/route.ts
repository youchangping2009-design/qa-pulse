import { NextResponse } from "next/server";
import { publicConfigStatus } from "@/lib/config";

export async function GET() {
  return NextResponse.json(publicConfigStatus());
}
