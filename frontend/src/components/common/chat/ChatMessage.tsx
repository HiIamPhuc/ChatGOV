import styled from "styled-components";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

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
  icon?: string;
  image?: string;
};

export default function ChatMessage({
  msg,
  done = true,
}: {
  msg: Msg;
  done?: boolean;
}) {
  const isAssistant = /^(assistant|ai)$/i.test(String(msg.role || ""));
  const raw = String(msg.content ?? "");

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
      const pad = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const estW = 360;
      const estH = 210;
      let x = rect.left;
      let y = rect.bottom + 8;

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

    const listeners: Array<
      [(e: Event) => void, (e: Event) => void, (e: Event) => void, (e: Event) => void]
    > = [];

    anchors.forEach((a) => {
      const onEnter = () => showFor(a);
      const onLeave = () => hide();
      const onFocus = () => showFor(a);
      const onBlur = () => hide();
      a.addEventListener("mouseenter", onEnter);
      a.addEventListener("mouseleave", onLeave);
      a.addEventListener("focus", onFocus);
      a.addEventListener("blur", onBlur);
      listeners.push([onEnter, onLeave, onFocus, onBlur]);
    });

    const onScroll = hide;
    const onWheel = hide;
    const onPointerDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el?.closest?.(".md a")) hide();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    const onBlurWindow = hide;

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onBlurWindow);

    return () => {
      anchors.forEach((a, i) => {
        const [onEnter, onLeave, onFocus, onBlur] = listeners[i]!;
        a.removeEventListener("mouseenter", onEnter);
        a.removeEventListener("mouseleave", onLeave);
        a.removeEventListener("focus", onFocus);
        a.removeEventListener("blur", onBlur);
      });
      window.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("wheel", onWheel as any);
      window.removeEventListener("pointerdown", onPointerDown as any);
      window.removeEventListener("keydown", onKeyDown as any);
      window.removeEventListener("blur", onBlurWindow as any);
      if (fetchTimer) window.clearTimeout(fetchTimer);
      setPreview({ show: false, x: 0, y: 0, loading: false, data: null });
    };
  }, [mdKey]);

  if (hiddenAssistant) return null;

  return (
    <Item className={isAssistant ? "assistant" : "user"}>
      {isAssistant ? (
        <div className="assistantShell">
          <div className="assistantAvatar" aria-hidden="true">
            AI
          </div>
          <div className="assistantBody">
            {!!steps && (
              <>
                <div className="hint">Da suy nghi trong giay lat</div>
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
                {copied ? "Da chep" : "Sao chep"}
              </button>
            </div>
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
                    <div className="loading">Dang lay thong tin...</div>
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
        <div className="userBubble">
          <span className="userText">{raw}</span>
        </div>
      )}
    </Item>
  );
}

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
  ) {
    return false;
  }
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

async function fetchOG(url: string): Promise<Partial<PreviewData> | null> {
  try {
    const r = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=false`,
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

const Item = styled.div`
  display: flex;
  margin: 26px 0;
  justify-content: flex-start;

  &.user {
    justify-content: flex-end;
  }

  .assistantShell {
    width: min(860px, 100%);
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 14px;
    align-items: start;
  }

  .assistantAvatar {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    font-size: 0.72rem;
    font-weight: 800;
    color: #fff;
    background: linear-gradient(
      180deg,
      ${({ theme }) => theme.colors.accent},
      ${({ theme }) => theme.colors.accent2}
    );
    box-shadow: 0 8px 22px rgba(144, 57, 56, 0.22);
  }

  .assistantBody {
    min-width: 0;
    color: ${({ theme }) => theme.colors.primary};
    line-height: 1.7;
  }

  .hint {
    font-size: 0.98rem;
    color: ${({ theme }) => theme.colors.secondary};
    margin-bottom: 14px;
  }

  .steps {
    list-style: none;
    padding: 0;
    margin: 0 0 16px;
    display: grid;
    gap: 10px;
  }

  .steps li {
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: 12px;
    align-items: start;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 14px;
  }

  .steps .idx {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: ${({ theme }) => theme.colors.surface2};
    color: ${({ theme }) => theme.colors.accent2};
    font-size: 0.86rem;
    font-weight: 700;
  }

  .md {
    min-width: 0;
    font-size: 1.04rem;
  }

  .md :is(p, ul, ol, blockquote, pre, table) {
    margin: 0.85rem 0;
  }

  .md > :first-child {
    margin-top: 0;
  }

  .md > :last-child {
    margin-bottom: 0;
  }

  .md ul,
  .md ol {
    padding-left: 1.35rem;
  }

  .md :is(p, li, td, th) {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .md h1,
  .md h2,
  .md h3 {
    line-height: 1.25;
    margin: 1.1rem 0 0.55rem;
    color: ${({ theme }) => theme.colors.primary};
  }

  .md strong {
    font-weight: 800;
  }

  .md a {
    color: ${({ theme }) => theme.colors.accent2};
    text-decoration: none;
    font-weight: 600;
    border-bottom: 1px solid rgba(144, 57, 56, 0.28);
  }

  .md a:hover {
    border-bottom-color: currentColor;
  }

  .md code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      "Liberation Mono", "Courier New", monospace;
    background: ${({ theme }) => theme.colors.surface2};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 8px;
    padding: 0.16rem 0.38rem;
    font-size: 0.9em;
  }

  .md pre {
    max-width: 100%;
    overflow: auto;
    padding: 0.9rem 1rem;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 16px;
  }

  .md pre code {
    display: block;
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
  }

  .md table {
    width: 100%;
    min-width: 640px;
    border-collapse: collapse;
    border-spacing: 0;
  }

  .md table thead tr {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  .md table tbody tr {
    border-bottom: 1px solid rgba(239, 216, 205, 0.82);
  }

  .md th,
  .md td {
    padding: 14px 14px 14px 0;
    text-align: left;
    vertical-align: top;
    border: 0;
  }

  .md th {
    font-size: 0.96rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.primary};
  }

  .md td {
    color: ${({ theme }) => theme.colors.primary};
  }

  .md p + table,
  .md table + p {
    margin-top: 1rem;
  }

  .md blockquote {
    margin-left: 0;
    padding-left: 14px;
    border-left: 3px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.secondary};
  }

  .streaming {
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: anywhere;
    margin: 0;
    background: transparent;
    border: 0;
    padding: 0;
    font: inherit;
    color: ${({ theme }) => theme.colors.primary};
  }

  .linkcard {
    margin-top: 14px;
    padding: 12px 14px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: rgba(255, 255, 255, 0.78);
    border-radius: 16px;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .linkcard a {
    color: ${({ theme }) => theme.colors.accent2};
    font-weight: 600;
  }

  .toolbar {
    display: flex;
    justify-content: flex-start;
    margin-top: 14px;
    gap: 6px;
  }

  .tbtn {
    height: 28px;
    padding: 0 11px;
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.secondary};
    font-size: 12px;
    cursor: pointer;
    transition: all 0.12s ease;
  }

  .tbtn:hover {
    color: ${({ theme }) => theme.colors.accent};
    border-color: ${({ theme }) => theme.colors.accent};
    background: rgba(206, 122, 88, 0.08);
  }

  .userBubble {
    max-width: min(760px, 78%);
    padding: 14px 20px;
    border-radius: 999px;
    background: rgba(34, 34, 34, 0.08);
    color: ${({ theme }) => theme.colors.primary};
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(6px);
  }

  .userText {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
    font-size: 1rem;
    line-height: 1.45;
  }

  @media (max-width: 720px) {
    margin: 18px 0;

    .assistantShell {
      grid-template-columns: 28px minmax(0, 1fr);
      gap: 10px;
    }

    .assistantAvatar {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      font-size: 0.64rem;
    }

    .md {
      font-size: 0.98rem;
    }

    .md table {
      min-width: 520px;
    }

    .userBubble {
      max-width: 92%;
      border-radius: 24px;
    }
  }
`;

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
