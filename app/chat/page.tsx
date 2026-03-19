"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const Graph = dynamic(() => import("@/components/Graph"), {
  ssr: false,
});
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
const formatMath = (text: string) => {
  return text
    .replace(/\\\[([\s\S]+?)\\\]/g, "$$$$$1$$$$")  // [ ... ] → $$ ... $$
    .replace(/\\\(([\s\S]+?)\\\)/g, "$$$$$1$$$$")  // ( ... ) → $$ ... $$
}

type Message = {
  role: "user" | "assistant";
  content: string;
  image?: string;
  file?: {
    name: string;
    url: string;
  };
};
type Chat = {
  id: string;
  title: string;
  messages: Message[];
};
export default function Home() {
  const [chats, setChats] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const handleNewChat = () => {
  const newChat = {
    id: Date.now().toString(),
    title: "Cuộc trò chuyện mới",
    messages: [],
  };

  setChats(prev => [newChat, ...prev]);
  setCurrentChatId(newChat.id);
};

  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [selectedText, setSelectedText] = useState("")
const [showAskAI, setShowAskAI] = useState(false)
const [askPosition, setAskPosition] = useState({ x: 0, y: 0 })
useEffect(() => {
  const handleSelection = () => {
    const selection = window.getSelection()?.toString()

    if (selection && selection.length > 5) {
      const rect = window.getSelection()?.getRangeAt(0).getBoundingClientRect()

      if (rect) {
        setSelectedText(selection)
        setShowAskAI(true)
        setAskPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 40
        })
      }
    } else {
      setShowAskAI(false)
    }
  }

  document.addEventListener("mouseup", handleSelection)

  return () => {
    document.removeEventListener("mouseup", handleSelection)
  }
}, [])
  const [image, setImage] = useState<string | null>(null)
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const handleAskAI = () => {

  const cleaned = selectedText.replace(/\n/g," ").trim()

  const formatted = `Trích đoạn:

"${cleaned}"

Câu hỏi: `

  setInput(formatted)

  setShowAskAI(false)
}
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!currentChatId) return;

  const files = e.target.files;
  if (!files) return;

  Array.from(files).forEach((file) => {
    const reader = new FileReader();

    reader.onload = () => {
      const isImage = file.type.startsWith("image/");

      const newMessage: Message = {
        role: "user",
        content: "",
        ...(isImage
          ? { image: reader.result as string }
          : {
              file: {
                name: file.name,
                url: reader.result as string,
              },
            }),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [...chat.messages, newMessage],
              }
            : chat
        )
      );
    };

    reader.readAsDataURL(file);
  });

  e.target.value = ""; // reset input
};
useEffect(() => {
  const fetchUser = async () => {
  const res = await fetch(`${window.location.origin}/api/me`);
  const data = await res.json();
  setUser(data);
};

  fetchUser();
}, []);
  // Load localStorage
  useEffect(() => {
    const savedChats = localStorage.getItem("chats");
    if (savedChats) {
      const parsed = JSON.parse(savedChats);
      setChats(parsed);
      if (parsed.length > 0) {
        setCurrentChatId(parsed[0].id);
      }
    }
  }, []);

  // Save localStorage
  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);
const currentChat = chats.find(chat => chat.id === currentChatId);
  const messages = currentChat?.messages || [];
useEffect(() => {
  if (chatContainerRef.current) {
    chatContainerRef.current.scrollTop =
      chatContainerRef.current.scrollHeight;
  }
}, [messages, loading]);

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: "Cuộc trò chuyện mới",
      messages: [
        { role: "assistant", content: "Chào bạn! Tôi có thể giúp gì?" }
      ]
    };

    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const clearAllChats = () => {
    setChats([]);
    setCurrentChatId(null);
    localStorage.removeItem("chats");
  };
const handlePaste = (e: React.ClipboardEvent) => {
  const items = e.clipboardData.items

  for (let item of items) {
    if (item.type.indexOf("image") !== -1) {
      const file = item.getAsFile()
      const reader = new FileReader()

      reader.onload = (event) => {
        setImage(event.target?.result as string)
      }

      if (file) {
        reader.readAsDataURL(file)
      }
    }
  }
}
  const handleSend = async () => {
    if (!input || !currentChatId) return;

    const userMessage = {
  role: "user",
  content: input,
  image: image
};

    setChats(prevChats =>
  prevChats.map(chat => {
    if (chat.id === currentChatId) {

      const updatedMessages = [...chat.messages, userMessage];

      // 👉 Nếu chat chưa có title thực sự
      const newTitle =
        chat.messages.length === 0
          ? userMessage.content.slice(0, 30)
          : chat.title;

      return {
        ...chat,
        messages: updatedMessages,
        title: newTitle,
      };
    }
    return chat;
  })
);
setInput("");

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  message: input,
  image: image
})
      });

      const data = await res.json();

// ❌ Nếu bị chặn (403)
if (!res.ok) {
  const aiMessage = {
    role: "assistant",
    content:
      data.error || "🚫 Bạn đã dùng hết số câu hỏi. Vui lòng nâng cấp gói!",
  };

  setChats(prev =>
    prev.map(chat =>
      chat.id === currentChatId
        ? { ...chat, messages: [...chat.messages, aiMessage] }
        : chat
    )
  );

  // ⏳ 5 giây → chuyển trang upgrade
  setTimeout(() => {
    window.location.href = "/upgrade";
  }, 5000);

  setLoading(false);
  return; // ❗ RẤT QUAN TRỌNG
}

// ✅ Nếu OK
const aiMessage = { role: "assistant", content: data.reply };

setChats(prev =>
  prev.map(chat =>
    chat.id === currentChatId
      ? { ...chat, messages: [...chat.messages, aiMessage] }
      : chat
  )
);

      setLoading(false);
      setInput("")
      setImage(null);
      const textarea = document.querySelector("textarea")
if(textarea){
 textarea.style.height="auto"
}
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };
const handleLogout = async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "/";
};
  return (
    <>
     <div className="relative flex h-screen w-screen bg-[#343541] text-white overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 bg-[#202123] p-4 flex flex-col">
        <button
  onClick={handleNewChat}
  className="w-full p-2 bg-gray-700 rounded"
>
  + Cuộc trò chuyện mới
</button>

        <button
          onClick={clearAllChats}
          className="mt-3 bg-[#5C4033] hover:bg-[#4a342a] text-white p-2 rounded transition"
        >
          Xóa toàn bộ
        </button>

        <div className="mt-4 space-y-2 overflow-y-auto">
          {chats.map(chat => (
  <div key={chat.id} className="group relative">

    <button
      onClick={() => setCurrentChatId(chat.id)}
      className={`w-full text-left p-2 rounded ${
        currentChatId === chat.id
          ? "bg-gray-600"
          : "bg-gray-700"
      }`}
    >
      {chat.title}
    </button>

    {/* Nút đổi tên */}
    <button
      onClick={() => {
        const newName = prompt("Đổi tên cuộc trò chuyện:", chat.title);
        if (!newName) return;

        setChats(prev =>
          prev.map(c =>
            c.id === chat.id
              ? { ...c, title: newName }
              : c
          )
        );
      }}
      className="absolute right-2 top-2 hidden group-hover:block text-xs"
    >
      ✏️
    </button>

  </div>
))}

        </div>
{/* User Menu - Bottom Right */}
<div className="mt-auto relative">
  <div className="mt-auto pt-4 border-t border-gray-700 relative">
    {/* User Box */}
    <div
  onClick={() => setOpenUserMenu(!openUserMenu)}
  className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-700"
>
 <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center uppercase font-semibold">
  {(user?.name || user?.email)?.charAt(0).toUpperCase() || "U"}
</div>

<span>
  {user?.name || user?.email?.split("@")[0] || "User"}
</span>
</div>

    {/* Dropdown */}
    {openUserMenu && (
      <div className="absolute bottom-full mb-2 left-0 w-60 bg-white text-black rounded-lg shadow-lg overflow-hidden z-50">
        
        <Link
  href="/upgrade"
  onClick={() => setOpenUserMenu(false)}
  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
>
  Nâng cấp gói
</Link>

<Link
  href="/settings"
  onClick={() => setOpenUserMenu(false)}
  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
>
  Cài đặt
</Link>

<Link
  href="/help"
  onClick={() => setOpenUserMenu(false)}
  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
>
  Trợ giúp
</Link>
<Link
  href="/account"
  onClick={() => setOpenUserMenu(false)}
  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
>
  Thông tin gói cước
</Link>
        <div className="border-t"></div>

        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
        >
          Đăng xuất
        </button>
      </div>
    )}
  </div>
</div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        
        {/* Chat area */}
        <div
  ref={chatContainerRef}
  className="flex-1 overflow-y-auto p-6 space-y-4"
>
          {messages.map((msg: any, index: number) => (
            <div
              key={index}
              className={`max-w-3xl p-4 rounded-lg ${
                msg.role === "user"
                  ? "ml-auto bg-[#3E3F4B]"
                  : "bg-[#444654]"
              }`}
            >
              <span className="font-bold text-green-400">
                {msg.role === "user" ? "Bạn: " : "AI: "}
              </span>

              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
  blockquote: ({node, ...props}) => (
    <blockquote className="border-l-4 border-gray-400 pl-4 py-2 bg-gray-700/40 rounded">
      {props.children}
    </blockquote>
  )
 }}
              >
                {formatMath(msg.content)}
              </ReactMarkdown>
              {msg.image && (
  <img
    src={msg.image}
    style={{
      maxWidth: "300px",
      borderRadius: "8px",
      marginTop: "8px"
    }}
  />
)}
              {/* Vẽ đồ thị */}
    {msg.content.includes("y=") && (
      (() => {
        const match = msg.content.match(/y\s*=\s*([^\n]+)/i)
        const equation = match ? match[1] : ""
        return <Graph equation={equation} />
      })()
    )}
            </div>
            
          ))}

          {loading && (
            <div className="bg-green-800 p-4 rounded-lg max-w-3xl">
              <span className="font-bold text-white">AI:</span> Đang trả lời...
            </div>
          )}
          
        </div>

        <div className="p-4 bg-[#40414F] border-t border-gray-700">
  <div className="flex gap-2 max-w-3xl mx-auto">

    <textarea
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onPaste={handlePaste}
      placeholder="Nhập câu hỏi..."
      rows={1}
      className="w-full p-3 rounded-lg bg-gray-600 text-white resize-none whitespace-pre-wrap wrap-break-word overflow-x-hidden"
      onInput={(e:any)=>{
        e.target.style.height="auto"
        e.target.style.height=e.target.scrollHeight+"px"
      }}
      onKeyDown={(e)=>{
        if(e.key==="Enter" && !e.shiftKey){
          e.preventDefault()
          handleSend()
        }
      }}
    />

    <button
      onClick={handleSend}
      className="bg-green-600 px-4 rounded hover:bg-green-700"
    >
      Gửi
    </button>

  </div>
</div>
      </div>
      
    </div>
    {showAskAI && (
  <button
    onClick={handleAskAI}
    style={{
      position: "fixed",
      left: askPosition.x,
      top: askPosition.y,
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: "20px",
      padding: "6px 12px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
      cursor: "pointer",
      zIndex: 999
    }}
  >
    ❝ Hỏi AI
  </button>
)}
</>
  );
}
