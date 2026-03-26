import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateToken } from "@/lib/auth";
import { cookies } from "next/headers";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Email không tồn tại" },
      { status: 401 }
    );
  }

  const isMatch = await bcrypt.compare(password, user.password!);

  if (!isMatch) {
    return NextResponse.json(
      { message: "Sai mật khẩu" },
      { status: 401 }
    );
  }
const token = generateToken({
  id: user.id,
  email: user.email,
});

  const response = NextResponse.json({
  message: "Login thành công",
});
response.cookies.set("user_email", user.email, {
  httpOnly: true,
  path: "/",
});
response.cookies.set("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
});

return response;
}