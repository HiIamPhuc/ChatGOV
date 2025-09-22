import styled from "styled-components";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

type Msg = { id:string; role:"user"|"assistant"; content:string; };

function extractSteps(raw:string): string[] | null {
  // Cho phép nhúng JSON steps trong HTML comment: <!--steps:[...]-->
  const m = raw.match(/<!--\s*steps\s*:\s*(\[[\s\S]*?\])\s*-->/i);
  if(!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

export default function ChatMessage({msg}:{msg:Msg}){
  const [showSource, setShowSource] = useState(false);
  const steps = useMemo(()=> extractSteps(msg.content), [msg.content]);
  const url = useMemo(()=>{ const m = msg.content.match(/https?:\/\/\S+/); return m?m[0]:null; }, [msg.content]);
  const cleanContent = useMemo(()=> msg.content.replace(/<!--\s*steps\s*:\s*\[[\s\S]*?\]\s*-->/i, ""), [msg.content]);

  const copyMarkdown = async () => {
    try { await navigator.clipboard.writeText(msg.content); } catch {}
  };

  return (
    <Item className={msg.role}>
      <div className="bubble">
        {msg.role==="assistant" ? (
          <div className="assistant">
            <div className="toolbar">
              {!!steps && <span className="hint">Hướng dẫn từng bước</span>}
              <div className="spacer" />
              <button className="ghost" onClick={()=>setShowSource(v=>!v)}>{showSource ? "Ẩn Markdown" : "Hiện Markdown"}</button>
              <button className="primary" onClick={copyMarkdown}>Copy Markdown</button>
            </div>

            {url && (
              <div className="linkcard">
                <a href={url} target="_blank" rel="noreferrer noopener">{url}</a>
              </div>
            )}

            {steps && (
              <ol className="steps">
                {steps.map((s,i)=>(<li key={i}><span className="idx">{i+1}</span><span className="tx">{s}</span></li>))}
              </ol>
            )}

            {!showSource ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{cleanContent}</ReactMarkdown>
            ) : (
              <pre className="source"><code>{msg.content}</code></pre>
            )}
          </div>
        ) : (
          <span>{msg.content}</span>
        )}
      </div>
    </Item>
  );
}

const Item = styled.div`
  display:flex; margin: 10px 0; justify-content:flex-start;
  &.user{ justify-content:flex-end; }
  .bubble{
    max-width: min(720px, 92%); padding: 12px 14px; border-radius: 16px;
    background:${({theme})=>theme.colors.surface}; border:1px solid ${({theme})=>theme.colors.border}; color:${({theme})=>theme.colors.primary}; line-height:1.55;
    box-shadow:${({theme})=>theme.shadow};
  }
  &.user .bubble{
    background:${({theme})=>theme.colors.surface2}; border-color:${({theme})=>theme.colors.border};
  }

  .assistant .toolbar{
    display:flex; align-items:center; gap:8px; margin-bottom:6px;
  }
  .assistant .toolbar .ghost{
    background:transparent; border:1px solid ${({theme})=>theme.colors.border}; color:${({theme})=>theme.colors.secondary};
    height:28px; padding:0 10px; border-radius:8px; cursor:pointer;
  }
  .assistant .toolbar .primary{
    background:${({theme})=>theme.colors.accent}; color:white; border:none; height:28px; padding:0 10px; border-radius:8px; cursor:pointer;
  }
  .assistant .toolbar .spacer{ flex:1; }
  .assistant .toolbar .hint{ font-size:.9rem; color:${({theme})=>theme.colors.secondary}; }

  .linkcard{ padding:10px 12px; border:1px solid #e6e6e6; background:#fff; border-radius:10px; margin:8px 0; word-break:break-all; }

  .steps{ list-style:none; padding:0; margin:8px 0 12px 0; }
  .steps li{ display:flex; gap:8px; align-items:flex-start; padding:6px 8px; background:#fff7f2; border:1px solid #f2e6df; border-radius:10px; margin-bottom:6px; }
  .steps .idx{ display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:999px; background:#ce7a58; color:white; font-size:.85rem; font-weight:600; flex:0 0 auto; }
  .steps .tx{ flex:1; }

  .source{ background:#fffaf4; border:1px dashed #e7d9d0; border-radius:10px; padding:10px; overflow:auto; }
`;
