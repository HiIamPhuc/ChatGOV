// backend/supabase/functions/chat/index.ts
import { serve } from "https://deno.land/std/http/server.ts";

function hasUrl(str: string) {
  return /(https?:\/\/\S+)/.test(str || "");
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const { sessionId, rootUrl, prompt } = await req.json();

  if (hasUrl(prompt)) {
    const text = "Bạn vừa dán URL trong ô nhắn tin. Vui lòng tạo **Session mới** và dán URL vào ô **Link website** để giữ đúng ngữ cảnh.";
    return new Response(JSON.stringify({ text }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const text = [
    "## Gợi ý điều hướng",
    `- ✅ [Trang dịch vụ đăng ký](${rootUrl || "https://example.com/dich-vu"}) — vì khớp từ khóa 'đăng ký'`,
    `- [Trang nộp hồ sơ](${rootUrl || "https://example.com/nop-ho-so"})`,
    "",
    "**Bước tiếp theo**",
    "1) Mở liên kết ✅",
    "2) Chọn “Nộp hồ sơ trực tuyến”",
    "3) Đăng nhập/Đăng ký tài khoản, chuẩn bị CCCD",
  ].join("\n");

  return new Response(JSON.stringify({ text }), {
    headers: { "Content-Type": "application/json" },
  });
});
