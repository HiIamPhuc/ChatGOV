import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useI18n } from "@/app/i18n";
import SendButton from "@/components/common/buttons/SendButton";

type Props = {
  onSend: (p: { prompt: string; rootUrl?: string }) => void;
  maxWidth?: number;   // composer max width (px)
  compact?: boolean;   // dùng ở màn hình home (nhỏ gọn)
};

const MAX_HEIGHT = 200;
const CONTROLS_H = 44;   // chiều cao hàng nút dưới
const ONE_LINE_H = 36;   // chiều cao 1 dòng của textarea

const PromptInput: React.FC<Props> = ({ onSend, maxWidth = 820, compact }) => {
  const { t } = useI18n();

  const [prompt, setPrompt] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState("");

  const [isTall, setIsTall] = useState(false); // textarea > 1 dòng?
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const linkRef = useRef<HTMLInputElement | null>(null);

  const autosize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const next = Math.min(ta.scrollHeight, MAX_HEIGHT);
    ta.style.height = next + "px";
    ta.style.overflowY = ta.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
    setIsTall(next > ONE_LINE_H + 2); // > ~1 dòng thì coi như cao
  };

  useEffect(() => { autosize(); }, []);

  const submit = () => {
    const text = prompt.trim();
    if (!text) return;
    const urlInPrompt = /(https?:\/\/\S+)/.test(text);
    if (urlInPrompt) { alert(t("urlInPromptWarn")); return; }
    onSend({ prompt: text, rootUrl: link.trim() || undefined });
    setPrompt("");
    requestAnimationFrame(autosize);
  };

  const toggleLink = () => {
    setLinkOpen(v => !v);
    setTimeout(() => linkRef.current?.focus(), 10);
  };

  const confirmLink = () => {
    setLinkOpen(false);
    taRef.current?.focus();
  };

  // Khi có chip/link mở hoặc textarea cao → stack đẩy lên trên
  const stackHasTop = !!link || isTall || linkOpen;

  return (
    <Outer style={{ ["--composer-max" as any]: `${maxWidth}px` }}>
      <div className={`composer ${compact ? "compact" : ""}`}>
        <div className="box">
          {/* ===== STACK (trên): chip link + textarea ===== */}
          <div className={`stack ${stackHasTop ? "top" : "middle"}`}>
            {/* chip link (khi đã set link và đang KHÔNG mở input) */}
            {link && !linkOpen && (
              <div className="row">
                <button className="chip" title={link} onClick={() => setLinkOpen(true)}>
                  <span className="chip-dot" />
                  <span className="chip-text">{link}</span>
                  <span
                    className="chip-x"
                    onClick={(e) => { e.stopPropagation(); setLink(""); }}
                    aria-label="remove"
                  >
                    ×
                  </span>
                </button>
              </div>
            )}

            <textarea
              ref={taRef}
              rows={1}
              className="msgInput"
              placeholder={t("enterPrompt")}
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); autosize(); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
              }}
            />
          </div>

          {/* ===== CONTROLS (dưới): dấu + | ô link (nếu mở) | send ===== */}
          <div className="controls">
            <button
              type="button"
              className="plus"
              onClick={toggleLink}
              title={t("addLink")}
              aria-label={t("addLink")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8.5" />
                <path d="M10 6v8M6 10h8" />
              </svg>
            </button>

            {linkOpen && (
              <input
                ref={linkRef}
                type="url"
                className="linkInline"
                placeholder={t("linkPlaceholder")}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); confirmLink(); }
                  if (e.key === "Escape") setLinkOpen(false);
                }}
              />
            )}

            <div className="spacer" />
            <SendButton onClick={submit} label={t("send")} />
          </div>
        </div>
      </div>
    </Outer>
  );
};

export default PromptInput;

/* ===================== styles ===================== */
const Outer = styled.div`
  width: min(100%, var(--composer-max, 820px));
  margin: 0 auto;

  .composer.compact .box{ border-radius:12px; padding:8px 10px; }

  /* Hộp 2 hàng: stack (trên) & controls (dưới) */
  .box{
    display:grid;
    grid-template-rows: 1fr ${CONTROLS_H}px;
    gap: 8px;
    border:1px solid #1b2430; background:#0f141b; border-radius:16px;
    padding:10px 12px;
  }

  /* STACK
     - .middle: nội dung căn giữa theo trục dọc (1 dòng) ⇒ nhìn cùng hàng nút
     - .top: có chip / mở input link / textarea > 1 dòng ⇒ đẩy lên trên
  */
  .stack{
    min-height:${ONE_LINE_H}px;
    display:flex; flex-direction:column;
    max-height:${MAX_HEIGHT + 90}px; overflow:hidden;
  }
  .stack.middle{ justify-content:center; }
  .stack.top{ justify-content:flex-start; }
  .row{ margin-bottom:8px; }

  /* textarea */
  .msgInput{
    width:100%;
    max-height:${MAX_HEIGHT}px; resize:none; overflow:auto;
    background:transparent; border:none; outline:none; color:#e6edf3; font-size:.98rem;
  }
  .stack.middle .msgInput{ height:${ONE_LINE_H}px; line-height:${ONE_LINE_H}px; padding:0 6px; overflow:hidden; }
  .stack.top .msgInput{ line-height:1.35; padding:8px 6px 0 6px; }

  /* scrollbar tinh tế cho textarea */
  .msgInput::-webkit-scrollbar{ width:10px; }
  .msgInput::-webkit-scrollbar-track{ background: transparent; }
  .msgInput::-webkit-scrollbar-thumb{
    background:#222b36; border-radius:10px; border:2px solid transparent; background-clip:content-box;
  }
  .msgInput{ scrollbar-color:#222b36 transparent; scrollbar-width:thin; }

  /* controls */
  .controls{
    height:${CONTROLS_H}px; display:flex; align-items:center; gap:10px;
  }
  .spacer{ flex:1; }

  .plus{
    display:flex; align-items:center; justify-content:center;
    height:34px; width:34px; border-radius:10px;
    background:#0b1016; border:1px solid #1b2430; cursor:pointer; flex:0 0 auto;
  }
  .plus:hover{ background:#111a24; }
  .plus svg{ width:18px; height:18px; }
  .plus svg circle { fill:none; stroke:#7a8696; stroke-width:1.6; }
  .plus svg path   { stroke:#7a8696; stroke-width:1.8; stroke-linecap:round; }

  /* ô link: nằm CÙNG HÀNG với nút */
  .linkInline{
    width: clamp(260px, 36vw, 440px);
    height: 38px;
    border-radius: 12px;
    border: 1px solid #1b2430;
    background: #0b1016;
    color: #e6edf3;
    outline: none;
    padding: 0 12px;
    font-size: .95rem;
    flex: 0 1 auto;
  }

  /* chip (khi link đã set) – nằm trong stack */
  .chip{
    display:inline-flex; align-items:center; gap:8px;
    max-width:100%; padding:6px 10px; border-radius:999px;
    border:1px solid #1b2430; background:#0b1016; color:#e6edf3;
    cursor:pointer; transition:.2s;
  }
  .chip:hover{ background:#111a24; border-color:#243244; }
  .chip-dot{ width:8px; height:8px; border-radius:50%; background:#66b3ff; display:inline-block; }
  .chip-text{ max-width:calc(100% - 34px); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; opacity:.95; }
  .chip-x{ font-weight:700; line-height:1; padding:0 2px 1px; opacity:.8; }
  .chip-x:hover{ opacity:1; }
`;
