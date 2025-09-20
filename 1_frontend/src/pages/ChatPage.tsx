import { useEffect, useState } from "react";
import styled from "styled-components";
import Sidebar from "@/components/layout/Sidebar";
import PromptInput from "@/components/common/chat/PromptInput";
import ChatMessage from "@/components/common/chat/ChatMessage";
import LoaderTyping from "@/components/common/loaders/LoaderTyping";
import { supabase } from "@/app/supabaseClient";
import { useI18n } from "@/app/i18n";

type Msg = { id:string; role:"user"|"assistant"; content:string; };

export default function ChatPage(){
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const { t } = useI18n();

  useEffect(()=>{
    supabase.auth.getUser().then(({data})=>{
      if(!data.user) window.location.href = "/signin";
    });
  },[]);

  const onSend = async ({prompt, rootUrl}:{prompt:string; rootUrl?:string})=>{
    setMessages(m => [...m, {id:crypto.randomUUID(), role:"user", content:prompt}]);
    setTyping(true);
    await new Promise(r=>setTimeout(r, 700)); // stub: gọi bot thật ở đây
    const reply = `*(demo)* ${t("you_asked") ?? "You asked:"} **${prompt}**${rootUrl ? `\n\nSite: ${rootUrl}` : ""}`;
    setMessages(m => [...m, {id:crypto.randomUUID(), role:"assistant", content:reply}]);
    setTyping(false);
  };

  const isEmpty = messages.length === 0 && !typing;

  return (
    <Layout>
      <aside className="sidebar"><Sidebar/></aside>

      <section className="main">
        <header className="topbar">{t("appTitle")}</header>

        {isEmpty ? (
          // ======= HOME MODE (giống ảnh 2) =======
          <div className="home">
            <h1 className="hero">{t("heroTitle") ?? "What are you working on?"}</h1>
            <div className="heroComposer">
              <PromptInput onSend={onSend} maxWidth={720} compact />
            </div>
          </div>
        ) : (
          // ======= CHAT MODE (giống ảnh 3) =======
          <>
            <div className="scroll">
              <div className="inner">
                {messages.map(m => <ChatMessage key={m.id} msg={m} />)}
                {typing && <div className="typing"><LoaderTyping/></div>}
              </div>
            </div>
            <footer className="input">
              <PromptInput onSend={onSend} maxWidth={820} />
            </footer>
          </>
        )}
      </section>
    </Layout>
  );
}

const Layout = styled.div`
  height:100vh; display:grid; grid-template-columns: 280px 1fr; background:#0b0f14;

  @media (max-width: 900px){ grid-template-columns: 1fr; .sidebar{ display:none; } }

  .topbar{
    height:56px; display:flex; align-items:center; padding:0 16px;
    border-bottom:1px solid #1b2430;
    background: linear-gradient(180deg, #0f141b, #0b0f14);
    color:#e6edf3; font-weight:600; letter-spacing:.4px;
  }

  .main{ display:flex; flex-direction:column; }

  /* ===== HOME MODE ===== */
  .home{
    flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding: 24px 18px;
  }
  .hero{
    color:#e6edf3; text-align:center; font-weight:650; letter-spacing:.2px;
    font-size: clamp(22px, 3.6vw, 34px);
    margin: 0 0 22px;
  }
  .heroComposer{ width:100%; }

  /* ===== CHAT MODE ===== */
  .scroll{
    flex:1; overflow:auto;
    background: radial-gradient(1200px 600px at 50% -200px, #0f141b 0%, #0b0f14 60%, #0b0f14 100%);
  }
  .inner{ padding: 18px; display:flex; flex-direction:column; gap:10px; }
  .typing{ display:flex; justify-content:center; margin: 8px 0; }

  .input{
    position:sticky; bottom:0; padding:12px 18px; backdrop-filter: blur(6px);
    background: rgba(11,15,20,.65); border-top:1px solid #10161f;
  }

  /* scrollbar tinh tế cho vùng chat */
  .scroll::-webkit-scrollbar { width: 12px; }
  .scroll::-webkit-scrollbar-track { background: transparent; }
  .scroll::-webkit-scrollbar-thumb {
    background: #1e2732; border-radius: 10px; border: 3px solid transparent; background-clip: content-box;
  }
  .scroll{ scrollbar-color:#1e2732 transparent; scrollbar-width: thin; }
`;
