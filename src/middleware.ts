import { NextRequest, NextResponse } from "next/server";
import { setRequest } from "@/lib/session";

export function middleware(request: NextRequest) {
  setRequest(request);
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
