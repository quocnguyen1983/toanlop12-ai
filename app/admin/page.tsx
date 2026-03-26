import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
export const dynamic = "force-dynamic"
export default async function AdminPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    return redirect("/")
  }

  let decoded: any

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET as string)
  } catch (err) {
    return redirect("/")
  }

  // 🔥 DEBUG LOG (QUAN TRỌNG)
  console.log("DECODED:", decoded)

  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email,
    },
  })

  console.log("USER:", user)

  // 🔥 FIX role (convert uppercase)
  if (!user || user.role?.toUpperCase() !== "ADMIN") {
    return redirect("/")
  }
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 to-slate-900 text-white p-10">

      <h1 className="text-3xl font-bold">
        Admin Dashboard
      </h1>

      <p className="mt-4">
        Đây là trang quản trị hệ thống AI Toán
      </p>

      <div className="mt-8 grid grid-cols-3 gap-6">

        <a href="/admin/users" className="bg-blue-500 text-white p-6 rounded-xl">
          Quản lý Users
        </a>

        <a href="/admin/stats" className="bg-green-500 text-white p-6 rounded-xl">
          Thống kê
        </a>

        <a href="/admin/payments" className="bg-purple-500 text-white p-6 rounded-xl">
          Thanh toán
        </a>

      </div>

    </div>
  )
}