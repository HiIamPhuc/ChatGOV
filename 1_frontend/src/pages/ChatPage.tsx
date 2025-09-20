import { useState } from "react";
import ChatInput from "../components/ChatInput";
import ChatStream from "../components/ChatStream";

export default function ChatPage(){
  const [messages,setMessages]=useState<{id:string;role:"user"|"assistant";content:string;}[]>([]);

  const callChat = async ({rootUrl, prompt}:{rootUrl?:string; prompt:string}) => {
    setMessages(prev=>[...prev, {id:crypto.randomUUID(),role:"user",content:prompt}]);
    const res = await fetch(import.meta.env.VITE_CHAT_ENDPOINT, {
      method: "POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ sessionId:null, rootUrl, prompt })
    });
    const data = await res.json();
    setMessages(prev=>[...prev, {id:crypto.randomUUID(),role:"assistant",content:data.text ?? "(Không có dữ liệu)"}]);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-3 font-semibold">AI WRAPPER</div>
      <ChatStream messages={messages} />
      <ChatInput onSend={callChat} />
    </div>
  );
}
