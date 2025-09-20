import { useState } from "react";
type Props = { onSend: (p: {rootUrl?: string; prompt: string}) => void; };
export default function ChatInput({ onSend }: Props) {
  const [rootUrl,setRootUrl]=useState("");
  const [prompt,setPrompt]=useState("");

  const submit=()=> {
    const urlInPrompt = /(https?:\/\/\S+)/.test(prompt);
    if (urlInPrompt) {
      alert("Bạn dán URL trong ô nhắn tin. Hãy tạo session mới và dán vào ô 'Link website'.");
      return;
    }
    onSend({ rootUrl: rootUrl || undefined, prompt });
    setPrompt("");
  };

  return (
    <div className="border-t p-3 space-y-2">
      <input className="border p-2 w-full" placeholder="Link website (tùy chọn)" value={rootUrl} onChange={e=>setRootUrl(e.target.value)} />
      <textarea className="border p-2 w-full" rows={3} placeholder="Nhập yêu cầu của bạn…" value={prompt} onChange={e=>setPrompt(e.target.value)} />
      <div className="flex justify-end">
        <button className="bg-black text-white py-2 px-4" onClick={submit}>Gửi</button>
      </div>
    </div>
  );
}
