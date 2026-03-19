"use client";
export default function UpgradePage() {
  const handleUpgrade = async (plan: string, amount: number) => {
  if (amount === 0) {
    alert("Gói Free là mặc định, không cần thanh toán.");
    return;
  }

  try {
    const res = await fetch("/api/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, amount }),
    });

    if (!res.ok) {
      alert("Lỗi tạo thanh toán");
      return;
    }

    const data = await res.json();

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      alert("Không tạo được link thanh toán");
    }
  } catch (error) {
    console.error(error);
    alert("Có lỗi xảy ra");
  }
};
  const plans = [
  {
    name: "Free",
    price: "0đ",
    amount: 0,
    questions: "5 câu hỏi / tháng",
    tokens: "12,500 tokens",
    model: "GPT-3.5",
    highlight: false,
  },
  {
    name: "Standard",
    price: "99,000đ",
    amount: 99000,
    questions: "500 câu hỏi / tháng",
    tokens: "500,000 tokens",
    model: "GPT-3.5 Turbo",
    highlight: false,
  },
  {
    name: "Pro",
    price: "299,000đ",
    amount: 299000,
    questions: "2000 câu hỏi / tháng",
    tokens: "2,000,000 tokens",
    model: "GPT-4",
    highlight: true,
  },
  {
    name: "Premium",
    price: "599,000đ",
    amount: 599000,
    questions: "Không giới hạn câu hỏi",
    tokens: "10,000,000 tokens",
    model: "GPT-4 Turbo",
    highlight: false,
  },
];

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-16">
      <h1 className="text-4xl font-bold text-center mb-12">
        Chọn gói phù hợp với bạn
      </h1>

      <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`rounded-2xl p-6 border ${
              plan.highlight
                ? "border-green-500 bg-gray-800 scale-105 shadow-xl"
                : "border-gray-700 bg-gray-900"
            }`}
          >
            {plan.highlight && (
              <div className="mb-4 text-green-400 font-semibold text-sm">
                ⭐ Phổ biến nhất
              </div>
            )}

            <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>

            <p className="text-3xl font-bold mb-6">{plan.price}</p>

            <ul className="space-y-3 text-gray-300 mb-8">
              <li>• {plan.questions}</li>
              <li>• {plan.tokens}</li>
              <li>• Model: {plan.model}</li>
            </ul>

            <button
  onClick={() =>
    handleUpgrade(
      plan.name.toLowerCase(),
      parseInt(plan.price.replace(/\D/g, "")) || 0
    )
  }
  className={`w-full py-2 rounded-lg font-semibold ${
    plan.highlight
      ? "bg-green-600 hover:bg-green-700"
      : "bg-gray-700 hover:bg-gray-600"
  }`}
>
  Chọn gói
</button>
          </div>
        ))}
      </div>
    </div>
  );
}