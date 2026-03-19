import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  // ✅ Lấy token
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  // ✅ Verify token
  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Token không hợp lệ" }, { status: 401 });
  }

  // ✅ Lấy user
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User không tồn tại" }, { status: 404 });
  }

  // =========================
  // 🔥 RESET THEO THÁNG
  // =========================
  const now = new Date();

  if (user.resetDate && now > user.resetDate) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        questionsUsed: 0,
        tokensUsed: 0,
        resetDate: new Date(
          new Date().setMonth(new Date().getMonth() + 1)
        ),
      },
    });

    user.questionsUsed = 0;
    user.tokensUsed = 0;
  }

  // =========================
  // 🔥 CHECK LIMIT THEO GÓI
  // =========================
  const plan = (user.plan || "FREE").toUpperCase();

let maxQuestions = 5;

switch (plan) {
  case "STANDARD":
    maxQuestions = 500;
    break;
  case "PRO":
    maxQuestions = 2000;
    break;
  case "PREMIUM":
    maxQuestions = Infinity;
    break;
  case "FREE":
  default:
    maxQuestions = 5;
}
console.log("PLAN:", user.plan);
console.log("QUESTIONS USED:", user.questionsUsed);
console.log("MAX:", maxQuestions);
  if (user.questionsUsed >= maxQuestions) {
    return NextResponse.json(
      {
        error: "Bạn đã dùng hết số câu hỏi. Vui lòng nâng cấp gói!",
      },
      { status: 403 }
    );
  }

  try {
    const { message, image } = await req.json();

    // =========================
    // 🚀 GỌI AI (CHỈ KHI OK)
    // =========================
    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: `
Bạn là AI toán học.
Khi viết công thức toán:

Inline dùng: $...$

Ví dụ:
$x = -\frac{2}{3}$

Block dùng:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
Ví dụ:
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
Bạn là trợ lý toán học cho học sinh lớp 12.

Khi bài toán có hàm số, hãy luôn viết rõ dạng:

y = ...

Ví dụ:
y = x^2 - 3x + 1

Luôn trình bày lời giải rõ ràng từng bước.
Khi viết công thức toán hoặc bảng Latex phải đặt trong:

$$
...
$$
$$
\begin{matrix}{c|c}
x & y \\
-2 & -35 \\
-1 & -7 \\
0 & -1 \\
1 & 1 \\
2 & 17
\end{array}
$$
Nếu bài toán yêu cầu bảng biến thiên, hãy tạo bảng Markdown.

Ví dụ bảng biến thiên:

| x | -∞ | a | b | +∞ |
|---|----|----|----|----|
| y' | + | 0 | - | 0 | + |
| y | -∞ | ↑ | cực đại | ↓ | cực tiểu | ↑ | +∞ |

Luôn trình bày rõ ràng để học sinh dễ hiểu.
              `,
            },
          ],
        },
        {
          role: "user",
          content: image
            ? [
                {
                  type: "input_text",
                  text: message || "Giải bài toán trong ảnh",
                },
                {
                  type: "input_image",
                  image_url: image,
                  detail: "auto",
                },
              ]
            : [
                {
                  type: "input_text",
                  text: message || "Giải bài toán trong ảnh",
                },
              ],
        },
      ],
    });

    const usedTokens = completion.usage?.total_tokens || 0;

    // =========================
    // 📊 UPDATE SAU KHI SUCCESS
    // =========================
    await prisma.user.update({
      where: { id: user.id },
      data: {
        questionsUsed: { increment: 1 },
        tokensUsed: { increment: usedTokens },
      },
    });

    return NextResponse.json({
      reply: completion.output_text,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ reply: "Có lỗi xảy ra." });
  }
}