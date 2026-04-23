import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import type { JwtPayload } from "@/lib/auth/jwt";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = "session";
const TOKEN_MAX_AGE = 60 * 60 * 24; // 1일

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/install", "/api/auth/login", "/api/auth/signup"];
const ADMIN_ONLY_PATHS = ["/clients"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // 공개 경로 — 로그인 상태면 대시보드로
  if (isPublic) {
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        if (pathname === "/login" || pathname === "/signup") {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      } catch {
        // 토큰 만료/무효 — 그대로 진행
      }
    }
    return NextResponse.next();
  }

  // 보호 경로 — 미로그인 시 로그인으로
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify<JwtPayload>(token, JWT_SECRET);

    // 관리자 전용 경로 — member 접근 차단
    const isAdminOnly = ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path));
    if (isAdminOnly && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Sliding session — 활동이 있을 때마다 토큰 재발급
    const newPayload: JwtPayload = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role,
      email: payload.email,
    };
    const newToken = await new SignJWT(newPayload as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(JWT_SECRET);

    const response = NextResponse.next();
    response.cookies.set(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_MAX_AGE,
    });
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|json|js|woff2?|ttf)).*)",
  ],
};
