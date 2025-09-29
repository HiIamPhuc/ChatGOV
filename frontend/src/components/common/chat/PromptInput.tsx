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
  const [stack, setStack] = useState(false); // >1 dòng => true
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const autosize = () => {
    const ta = taRef.current;
    if (!ta) return;

    ta.style.height = "0px";
    const next = Math.min(ta.scrollHeight, MAX_HEIGHT);
    ta.style.height = next + "px";
    ta.style.overflowY = ta.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";

    const cs = window.getComputedStyle(ta);
    const lh = parseFloat(cs.lineHeight || "0") || 20;
    const lines = Math.round(ta.scrollHeight / lh);
    setStack(lines > 1);
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
        <div className={`box ${stack ? "stack" : ""}`}>
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
          <div className="send">
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

  .composer.compact .box {
    border-radius: ${({ theme }) => theme.radii.md};
    padding: 8px 10px;
  }

  .box {
    --rowH: 42px;
    display: flex;
    align-items: center;
    gap: 10px;

    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.radii.lg};
    padding: 10px 12px;
    box-shadow: ${({ theme }) => theme.shadow};
  }

  .box.stack {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .box.stack .send { justify-content: flex-end; height: auto; }
  .box.stack .msgInput { min-height: 0; line-height: 1.4; }

  /* Truyền kích thước cho nút mobile */
  .send {
    --iconBtn: var(--rowH);       /* SendButton đọc biến này */
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: var(--rowH);
  }

  .msgInput {
    flex: 1 1 auto;
    max-height: ${MAX_HEIGHT}px;
    resize: none;
    overflow: auto;
    background: transparent;
    border: none;
    outline: none;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 0.98rem;
    margin: 0;
    padding: 0;
  }
  .box:not(.stack) .msgInput {
    min-height: var(--rowH);
    line-height: var(--rowH);
  }
  .msgInput::placeholder { color: ${({ theme }) => theme.colors.secondary}; }

  .msgInput::-webkit-scrollbar { width: 10px; }
  .msgInput::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 10px;
    border: 2px solid transparent;
    background-clip: content-box;
  }

  @media (max-width: 600px) {
    .box { --rowH: 38px; }
  }
`;
