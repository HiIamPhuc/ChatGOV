import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useI18n } from "@/app/i18n";
import SendButton from "@/components/common/buttons/SendButton";

type Props = {
  onSend: (p: { prompt: string; rootUrl?: string }) => void;
  maxWidth?: number;
  compact?: boolean;
};

const MAX_HEIGHT = 200;

const PromptInput: React.FC<Props> = ({ onSend, maxWidth = 820, compact }) => {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const autosize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const next = Math.min(ta.scrollHeight, MAX_HEIGHT);
    ta.style.height = next + "px";
    ta.style.overflowY = ta.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  };
  useEffect(() => { autosize(); }, []);

  const submit = () => {
    const text = prompt.trim();
    if (!text) return;
    onSend({ prompt: text });
    setPrompt("");
    requestAnimationFrame(autosize);
  };

  return (
    <Outer style={{ ["--composer-max" as any]: `${maxWidth}px` }}>
      <div className={`composer ${compact ? "compact" : ""}`}>
        <div className="box">
          <textarea
            ref={taRef}
            rows={1}
            className="msgInput"
            placeholder={t("enterPrompt")}
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); autosize(); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          />
          <SendButton onClick={submit} label={t("send")} />
        </div>
      </div>
    </Outer>
  );
};

export default PromptInput;

/* ===================== styles ===================== */
const GOV = {
  accent:  "#ce7a58", // chính
  accent2: "#903938", // phụ
  border:  "#e6e6e6",
  surface: "#ffffff",
  text:    "#222222",
  muted:   "#777777",
  bg:      "#f5f5f5",
};

const Outer = styled.div`
  width: min(100%, var(--composer-max, 820px));
  margin: 0 auto;

  .composer.compact .box{ border-radius:12px; padding:8px 10px; }

  .box{
    display:flex; align-items:flex-end; gap:10px;
    border:1px solid ${GOV.border}; background:${GOV.surface}; border-radius:16px;
    padding:10px 12px;
    box-shadow: 0 6px 22px rgba(0,0,0,.04);
  }

  .msgInput{
    flex:1 1 auto;
    max-height:${MAX_HEIGHT}px; resize:none; overflow:auto;
    background:transparent; border:none; outline:none; color:${GOV.text}; font-size:.98rem;
  }
  .msgInput::placeholder{ color:${GOV.muted}; }
  .msgInput:focus{ outline:none; }
  .msgInput::-webkit-scrollbar{ width:10px; }
  .msgInput::-webkit-scrollbar-thumb{
    background:#dadada; border-radius:10px; border:2px solid transparent; background-clip:content-box;
  }
`;
