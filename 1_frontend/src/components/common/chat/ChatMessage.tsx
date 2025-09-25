import styled from "styled-components";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export type Msg = { id: string; role: "user" | "assistant" | "ai"; content: string };

export default function ChatMessage({ msg, done = true }: { msg: Msg; done?: boolean }) {
  const isAssistant = /^(assistant|ai)$/i.test(String(msg.role || ""));
  const raw = String(msg.content ?? "");

  // ---- Hooks: luôn gọi theo cùng thứ tự ----
  const steps = useMemo(() => extractSteps(raw), [raw]);
  const contentNoSteps = useMemo(
    () => raw.replace(/<!--\s*steps\s*:\s*\[[\s\S]*?\]\s*-->/i, ""),
    [raw]
  );

  // Chỉ normalize \r\n -> \n, không “vá” markdown
  const normalized = useMemo(() => contentNoSteps.replace(/\r\n/g, "\n"), [contentNoSteps]);

  // Ẩn assistant rỗng (sau khi đã gọi đủ hooks)
  const hiddenAssistant = useMemo(
    () => isAssistant && normalized.trim().length === 0 && !steps,
    [isAssistant, normalized, steps]
  );

  // Link card chỉ hiện khi xong
  const firstUrl = useMemo(() => findFirstUrl(normalized), [normalized]);
  const showCard = useMemo(
    () => done && !!firstUrl && shouldShowLinkCard(normalized, firstUrl!),
    [done, normalized, firstUrl]
  );

  // Key để buộc ReactMarkdown re-parse khi stream
  const mdKey = `md-${msg.id}-${normalized.length}`;

  const [copied, setCopied] = useState(false);
  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(normalized.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  if (hiddenAssistant) return null;

  return (
    <Item className={isAssistant ? "assistant" : "user"}>
      <div className="bubble">
        {isAssistant ? (
          <div className="assistant-inner">
            {!!steps && (
              <>
                <div className="hint">Hướng dẫn từng bước</div>
                <ol className="steps">
                  {steps.map((s, i) => (
                    <li key={i}>
                      <span className="idx">{i + 1}</span>
                      <span className="tx">{s}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}

            {/* Nội dung: stream = pre-wrap; done = Markdown */}
            {!done ? (
              <pre className="streaming">{normalized}</pre>
            ) : (
              <div className="md">
                <ReactMarkdown key={mdKey} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {normalized}
                </ReactMarkdown>
              </div>
            )}

            {showCard && (
              <div className="linkcard">
                <a href={firstUrl!} target="_blank" rel="noreferrer noopener">
                  {firstUrl}
                </a>
              </div>
            )}

            <div className="toolbar">
              <button className="tbtn" onClick={copyMarkdown} title="Copy">
                {copied ? "Đã chép" : "Copy"}
              </button>
            </div>
          </div>
        ) : (
          <span className="user-text">{raw}</span>
        )}
      </div>
    </Item>
  );
}

/* ================= helpers ================ */
function extractSteps(raw: string): string[] | null {
  const m = raw.match(/<!--\s*steps\s*:\s*(\[[\s\S]*?\])\s*-->/i);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

function findFirstUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s)]+/);
  return m ? m[0].replace(/[)\]]+$/, "") : null;
}

/** Chỉ show card khi có đúng 1 URL “trần” và không có markdown link sẵn. */
function shouldShowLinkCard(text: string, url: string): boolean {
  if (/\[[^\]]+\]\(https?:\/\/[^\s)]+\)/.test(text) || /<https?:\/\/[^>]+>/.test(text)) return false;
  const urls = text.match(/https?:\/\/[^\s)]+/g) || [];
  if (urls.length !== 1) return false;
  const onlyUrlBlock = text.trim() === url || text.trim() === `${url}\n`;
  return onlyUrlBlock;
}

/* ================= styles ================ */
const Item = styled.div`
  display: flex;
  margin: 16px 0;
  justify-content: flex-start;

  &.user { justify-content: flex-end; }

  .bubble {
    position: relative;
    max-width: min(740px, 92%);
    padding: 14px 16px;
    border-radius: ${({ theme }) => theme.radii.lg};
    background:
      linear-gradient(180deg, rgba(255,255,255,.66), rgba(255,255,255,.66)) padding-box,
      linear-gradient(180deg, rgba(255,255,255,0), rgba(0,0,0,.04)) border-box;
    border: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.primary};
    line-height: 1.65;
    box-shadow: ${({ theme }) => theme.shadow};
    transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
  }

  &.assistant .bubble { 
    background: radial-gradient(1200px 300px at -10% -20%, rgba(206,122,88,.08), transparent 60%)
                , ${({ theme }) => theme.colors.surface};
    border-color: ${({ theme }) => theme.colors.border};
  }

  &.user .bubble {
    background:
      linear-gradient(180deg, rgba(255,248,244,.85), rgba(255,248,244,.85)) padding-box,
      linear-gradient(180deg, rgba(206,122,88,.35), rgba(206,122,88,.15)) border-box;
    border-color: rgba(206,122,88,.45);
  }

  .bubble:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 12px 28px rgba(206,122,88,.14);
  }

  .assistant-inner .hint {
    font-size: .92rem; 
    color: ${({ theme }) => theme.colors.secondary};
    margin-bottom: 8px;
    letter-spacing: .2px;
  }

  .steps { 
    list-style: none; padding: 0; margin: 8px 0 12px 0;
    display: grid; gap: 8px;
  }

  .steps li {
    display: grid; grid-template-columns: 24px 1fr; gap: 10px; align-items: flex-start;
    padding: 8px 10px;
    background: ${({ theme }) => theme.colors.surface2};
    border: 1px dashed ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.md};
  }
  .steps .idx {
    display: inline-grid; place-items: center;
    width: 24px; height: 24px; border-radius: 999px;
    background: ${({ theme }) => theme.colors.accent2};
    color: #fff; font-size: .85rem; font-weight: 700;
  }
  .steps .tx { flex: 1; }

  /* Markdown polish */
  .md { font-size: 1rem; }
  .md :is(p, ul, ol, blockquote, pre, table) { margin: .55rem 0; }
  .md ul, .md ol { padding-left: 1.25rem; }
  .md a { color: ${({ theme }) => theme.colors.accent2}; text-decoration: none; border-bottom: 1px dashed currentColor; }
  .md a:hover { opacity: .9; }
  .md strong { color: ${({ theme }) => theme.colors.primary}; }
  .md blockquote {
    border-left: 3px solid ${({ theme }) => theme.colors.border};
    padding: .25rem .75rem; background: ${({ theme }) => theme.colors.surface2};
    border-radius: ${({ theme }) => theme.radii.sm};
    color: ${({ theme }) => theme.colors.secondary};
  }
  .md code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
    background: ${({ theme }) => theme.colors.surface2};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 8px; padding: .18rem .4rem; font-size: .92em;
  }
  .md pre code { display: block; padding: .9rem; border-radius: ${({ theme }) => theme.radii.md}; }
  .md h1, .md h2, .md h3 { line-height: 1.25; margin: .9rem 0 .5rem; color: ${({ theme }) => theme.colors.accent2}; }
  .md table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: ${({ theme }) => theme.radii.md}; }
  .md th, .md td { border: 1px solid ${({ theme }) => theme.colors.border}; padding: .45rem .6rem; }
  .md th { background: ${({ theme }) => theme.colors.surface2}; text-align: left; }

  /* Khi đang stream: hiển thị đúng xuống dòng theo \n */
  .streaming {
    white-space: pre-wrap;
    word-break: break-word;
    margin: .45rem 0;
    background: transparent;
    border: 0; padding: 0; font: inherit;
    color: ${({ theme }) => theme.colors.secondary};
  }

  .linkcard {
    padding: 12px 14px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.radii.md};
    margin: 10px 0 4px;
    display: flex; align-items: center; gap: 10px;
  }
  .linkcard a {
    color: ${({ theme }) => theme.colors.accent2}; font-weight: 600; word-break: break-all;
  }

  .toolbar {
    display: flex; justify-content: flex-end; margin-top: 8px; gap: 6px;
  }
  .tbtn {
    height: 26px; padding: 0 10px;
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surface2};
    color: ${({ theme }) => theme.colors.secondary};
    font-size: 12px; cursor: pointer;
    transition: all .12s ease;
  }
  .tbtn:hover {
    color: ${({ theme }) => theme.colors.accent};
    border-color: ${({ theme }) => theme.colors.accent};
    background: rgba(206, 122, 88, 0.10);
  }

  .user-text { white-space: pre-wrap; }
`;
