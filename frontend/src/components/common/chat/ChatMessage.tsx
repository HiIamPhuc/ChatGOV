import styled from "styled-components";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

/* ===================== types ===================== */
export type Msg = {
  id: string;
  role: "user" | "assistant" | "ai";
  content: string;
};

type PreviewData = {
  url: string;
  hostname: string;
  title?: string;
  description?: string;
  icon?: string; // favicon
  image?: string; // screenshot
};

/* ===================== component ===================== */
export default function ChatMessage({
  msg,
  done = true,
}: {
  msg: Msg;
  done?: boolean;
}) {
  const isAssistant = /^(assistant|ai)$/i.test(String(msg.role || ""));
  const raw = String(msg.content ?? "");

  // ---- Hooks theo đúng thứ tự ----
  const steps = useMemo(() => extractSteps(raw), [raw]);
  const contentNoSteps = useMemo(
    () => raw.replace(/<!--\s*steps\s*:\s*\[[\s\S]*?\]\s*-->/i, ""),
    [raw]
  );
  const normalized = useMemo(
    () => contentNoSteps.replace(/\r\n/g, "\n"),
    [contentNoSteps]
  );
  const hiddenAssistant = useMemo(
    () => isAssistant && normalized.trim().length === 0 && !steps,
    [isAssistant, normalized, steps]
  );

  // Link card
  const firstUrl = useMemo(() => findFirstUrl(normalized), [normalized]);
  const showCard = useMemo(
    () => done && !!firstUrl && shouldShowLinkCard(normalized, firstUrl!),
    [done, normalized, firstUrl]
  );

  const mdKey = `md-${msg.id}-${normalized.length}`;
  const [copied, setCopied] = useState(false);
  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(normalized.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  // ===== Link Preview hover =====
  const mdRef = useRef<HTMLDivElement | null>(null);
  const [preview, setPreview] = useState<{
    show: boolean;
    x: number;
    y: number;
    loading: boolean;
    data: PreviewData | null;
  }>({ show: false, x: 0, y: 0, loading: false, data: null });

  useEffect(() => {
    const root = mdRef.current;
    if (!root) return;

    const anchors = Array.from(
      root.querySelectorAll<HTMLAnchorElement>("a[href^='http']")
    );
    if (!anchors.length) return;

    let fetchTimer: number | null = null;

    const showFor = (a: HTMLAnchorElement) => {
      const rect = a.getBoundingClientRect();
      const pad = 8,
        vw = window.innerWidth,
        vh = window.innerHeight;
      const estW = 360,
        estH = 210;
      let x = rect.left,
        y = rect.bottom + 8;
      if (x + estW + pad > vw) x = Math.max(pad, vw - estW - pad);
      if (y + estH + pad > vh) y = rect.top - estH - 8;
      if (y < pad) y = Math.min(vh - estH - pad, rect.bottom + 8);

      const u = safeURL(a.href);
      const hostname = u ? u.hostname : a.href;
      const icon = u
        ? `https://www.google.com/s2/favicons?domain=${u.hostname}`
        : undefined;

      setPreview({
        show: true,
        x,
        y,
        loading: true,
        data: { url: a.href, hostname, icon },
      });

      if (fetchTimer) window.clearTimeout(fetchTimer);
      fetchTimer = window.setTimeout(async () => {
        const og = await fetchOG(a.href).catch(() => null);
        setPreview((p) => {
          if (!p.show || !p.data) return { ...p, loading: false };
          return {
            ...p,
            loading: false,
            data: {
              url: p.data.url,
              hostname: p.data.hostname,
              title: og?.title ?? p.data.title,
              description: og?.description ?? p.data.description,
              icon: og?.icon ?? p.data.icon,
              image: og?.image ?? p.data.image,
            },
          };
        });
      }, 120);
    };

    const hide = () => {
      if (fetchTimer) window.clearTimeout(fetchTimer);
      setPreview((p) => (p.show ? { ...p, show: false } : p));
    };

    // Gắn trực tiếp vào từng <a>: hover vào hiện, rời là ẩn
    const enterHandlers: Array<
      [
        (e: Event) => void,
        (e: Event) => void,
        (e: Event) => void,
        (e: Event) => void
      ]
    > = [];
    anchors.forEach((a) => {
      const hEnter = () => showFor(a);
      const hLeave = () => hide();
      const hFocus = () => showFor(a);
      const hBlur = () => hide();
      a.addEventListener("mouseenter", hEnter);
      a.addEventListener("mouseleave", hLeave);
      a.addEventListener("focus", hFocus);
      a.addEventListener("blur", hBlur);
      enterHandlers.push([hEnter, hLeave, hFocus, hBlur]);
    });

    // Ẩn khi cuộn / bấm ra ngoài / nhấn Esc / tab mất focus
    const onScroll = hide;
    const onWheel = hide;
    const onPointerDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el?.closest?.(".md a")) hide();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    const onBlur = hide;

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onBlur);

    return () => {
      anchors.forEach((a, i) => {
        const [hEnter, hLeave, hFocus, hBlur] = enterHandlers[i]!;
        a.removeEventListener("mouseenter", hEnter);
        a.removeEventListener("mouseleave", hLeave);
        a.removeEventListener("focus", hFocus);
        a.removeEventListener("blur", hBlur);
      });
      window.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("wheel", onWheel as any);
      window.removeEventListener("pointerdown", onPointerDown as any);
      window.removeEventListener("keydown", onKeyDown as any);
      window.removeEventListener("blur", onBlur as any);
      if (fetchTimer) window.clearTimeout(fetchTimer);
      setPreview({ show: false, x: 0, y: 0, loading: false, data: null });
    };
  }, [mdKey]);

  // Không override <a> → để toàn bộ hành vi click trái/phải/middle là NATIVE
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

            {!done ? (
              <pre className="streaming">{normalized}</pre>
            ) : (
              <div className="md" ref={mdRef}>
                <ReactMarkdown
                  key={mdKey}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {normalized}
                </ReactMarkdown>
              </div>
            )}

            {showCard && (
              <div className="linkcard">
                <a href={firstUrl!}>{firstUrl}</a>
              </div>
            )}

            <div className="toolbar">
              <button className="tbtn" onClick={copyMarkdown} title="Copy">
                {copied ? "Đã chép" : "Sao chép"}
              </button>
            </div>

            {preview.show && preview.data && (
              <Preview style={{ left: preview.x, top: preview.y }}>
                <div className="row">
                  {preview.data.icon && (
                    <img className="ico" src={preview.data.icon} alt="" />
                  )}
                  <div className="meta">
                    <div className="host">{preview.data.hostname}</div>
                    {preview.loading && (
                      <div className="loading">Đang lấy thông tin…</div>
                    )}
                    {preview.data.title && (
                      <div className="title">{preview.data.title}</div>
                    )}
                    {preview.data.description && (
                      <div className="desc">{preview.data.description}</div>
                    )}
                  </div>
                </div>
                {preview.data.image && (
                  <div className="thumb">
                    <img src={preview.data.image} alt="" />
                  </div>
                )}
              </Preview>
            )}
          </div>
        ) : (
          <span className="user-text">{raw}</span>
        )}
      </div>
    </Item>
  );
}

/* ===================== helpers ===================== */
function extractSteps(raw: string): string[] | null {
  const m = raw.match(/<!--\s*steps\s*:\s*(\[[\s\S]*?\])\s*-->/i);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}
function findFirstUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s)]+/);
  return m ? m[0].replace(/[)\]]+$/, "") : null;
}
function shouldShowLinkCard(text: string, url: string): boolean {
  if (
    /\[[^\]]+\]\(https?:\/\/[^\s)]+\)/.test(text) ||
    /<https?:\/\/[^>]+>/.test(text)
  )
    return false;
  const urls = text.match(/https?:\/\/[^\s)]+/g) || [];
  if (urls.length !== 1) return false;
  return text.trim() === url || text.trim() === `${url}\n`;
}
function safeURL(href: string): URL | null {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

/* Lấy Open Graph qua Microlink */
async function fetchOG(url: string): Promise<Partial<PreviewData> | null> {
  try {
    const r = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(
        url
      )}&screenshot=false`,
      { mode: "cors" }
    );
    const data = await r.json().catch(() => null);
    if (!data || data.status !== "success") return null;
    const d = data.data || {};
    return {
      title: d.title,
      description: d.description,
      icon: d.logo?.url || d.logo,
      image: d.image?.url || d.image,
    };
  } catch {
    return null;
  }
}

/* ===================== styles ===================== */
const Item = styled.div`
  display: flex;
  margin: 16px 0;
  justify-content: flex-start;
  &.user {
    justify-content: flex-end;
  }

  .bubble {
    position: relative;
    max-width: min(740px, 92%);
    padding: 14px 16px;
    border-radius: ${({ theme }) => theme.radii.lg};
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.primary};
    line-height: 1.65;
    box-shadow: ${({ theme }) => theme.shadow};
    transition: transform 0.12s ease, box-shadow 0.12s ease,
      border-color 0.12s ease;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  &.assistant .bubble {
    background: radial-gradient(
        1200px 300px at -10% -20%,
        rgba(206, 122, 88, 0.08),
        transparent 60%
      ),
      ${({ theme }) => theme.colors.surface};
  }
  &.user .bubble {
    background: linear-gradient(
          180deg,
          rgba(255, 248, 244, 0.85),
          rgba(255, 248, 244, 0.85)
        )
        padding-box,
      linear-gradient(
          180deg,
          rgba(206, 122, 88, 0.35),
          rgba(206, 122, 88, 0.15)
        )
        border-box;
    border-color: rgba(206, 122, 88, 0.45);
  }

  .assistant-inner .hint {
    font-size: 0.92rem;
    color: ${({ theme }) => theme.colors.secondary};
    margin-bottom: 8px;
    letter-spacing: 0.2px;
  }
  .steps {
    list-style: none;
    padding: 0;
    margin: 8px 0 12px;
    display: grid;
    gap: 8px;
  }
  .steps li {
    display: grid;
    grid-template-columns: 24px 1fr;
    gap: 10px;
    align-items: flex-start;
    padding: 8px 10px;
    background: ${({ theme }) => theme.colors.surface2};
    border: 1px dashed ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.md};
  }
  .steps .idx {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.accent2};
    color: #fff;
    font-size: 0.85rem;
    font-weight: 700;
  }
  .steps .tx {
    flex: 1;
  }

  .md {
    font-size: 1rem;
  }
  .md :is(p, ul, ol, blockquote, pre, table) {
    margin: 0.55rem 0;
  }
  .md ul,
  .md ol {
    padding-left: 1.25rem;
  }
  .md :is(p, li, td, th) {
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .md a {
    color: ${({ theme }) => theme.colors.accent2};
    text-decoration: none;
    border-bottom: 1px dashed currentColor;
    cursor: pointer;
    position: relative;
    z-index: 1;
  }
  .md a:hover {
    opacity: 0.9;
  }
  .md code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      "Liberation Mono", "Courier New", monospace;
    background: ${({ theme }) => theme.colors.surface2};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 8px;
    padding: 0.18rem 0.4rem;
    font-size: 0.92em;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .md pre {
    max-width: 100%;
    overflow: auto;
  }
  .md pre code {
    display: block;
    padding: 0.9rem;
    border-radius: ${({ theme }) => theme.radii.md};
  }
  .md h1,
  .md h2,
  .md h3 {
    line-height: 1.25;
    margin: 0.9rem 0 0.5rem;
    color: ${({ theme }) => theme.colors.accent2};
  }
  .md table {
    width: 100%;
    border-collapse: collapse;
    overflow: hidden;
    border-radius: ${({ theme }) => theme.radii.md};
  }
  .md th,
  .md td {
    border: 1px solid ${({ theme }) => theme.colors.border};
    padding: 0.45rem 0.6rem;
  }
  .md th {
    background: ${({ theme }) => theme.colors.surface2};
    text-align: left;
  }

  .streaming {
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: anywhere;
    margin: 0.45rem 0;
    background: transparent;
    border: 0;
    padding: 0;
    font: inherit;
    color: ${({ theme }) => theme.colors.secondary};
  }

  .linkcard {
    padding: 12px 14px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.radii.md};
    margin: 10px 0 4px;
    display: flex;
    align-items: center;
    gap: 10px;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .linkcard a {
    color: ${({ theme }) => theme.colors.accent2};
    font-weight: 600;
  }

  .toolbar {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
    gap: 6px;
  }
  .tbtn {
    height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surface2};
    color: ${({ theme }) => theme.colors.secondary};
    font-size: 12px;
    cursor: pointer;
    transition: all 0.12s ease;
  }
  .tbtn:hover {
    color: ${({ theme }) => theme.colors.accent};
    border-color: ${({ theme }) => theme.colors.accent};
    background: rgba(206, 122, 88, 0.1);
  }

  .user-text {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
`;

/* Tooltip preview */
const Preview = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  z-index: 9999;
  pointer-events: none;

  min-width: 280px;
  max-width: 380px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadow};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 12px;
  animation: fadeIn 0.12s ease-out;
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .row {
    display: grid;
    grid-template-columns: 20px 1fr;
    gap: 10px;
  }
  .ico {
    width: 20px;
    height: 20px;
    border-radius: 4px;
  }
  .meta {
    min-width: 0;
  }
  .host {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.secondary};
    margin-bottom: 2px;
  }
  .loading {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.secondary};
  }
  .title {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary};
    overflow-wrap: anywhere;
  }
  .desc {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.secondary};
    margin-top: 4px;
    overflow-wrap: anywhere;
  }

  .thumb {
    margin-top: 8px;
    overflow: hidden;
    border-radius: ${({ theme }) => theme.radii.sm};
  }
  .thumb img {
    width: 100%;
    display: block;
  }
`;
