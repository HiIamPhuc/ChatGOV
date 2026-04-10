import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useI18n } from "@/app/i18n";
import SendButton from "@/components/common/buttons/SendButton";

type Props = {
  onSend: (p: { prompt: string; rootUrl?: string }) => void;
  maxWidth?: number;
  compact?: boolean;
};

const MAX_HEIGHT = 220;

const PromptInput: React.FC<Props> = ({ onSend, maxWidth = 820, compact }) => {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const autosize = () => {
    const ta = taRef.current;
    if (!ta) return;

    ta.style.height = "0px";
    const next = Math.min(ta.scrollHeight, MAX_HEIGHT);
    ta.style.height = `${next}px`;
    ta.style.overflowY = ta.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  };

  useEffect(() => {
    autosize();
  }, []);

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
            onChange={(e) => {
              setPrompt(e.target.value);
              autosize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <div className="send">
            <SendButton onClick={submit} label="" />
          </div>
        </div>
      </div>
    </Outer>
  );
};

export default PromptInput;

const Outer = styled.div`
  width: min(100%, var(--composer-max, 820px));
  margin: 0 auto;

  .composer.compact .box {
    border-radius: 28px;
    padding: 12px 14px;
  }

  .box {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background:
      linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.98),
          rgba(255, 248, 244, 0.96)
        )
        padding-box,
      linear-gradient(180deg, rgba(206, 122, 88, 0.16), rgba(144, 57, 56, 0.08))
        border-box;
    border-radius: 32px;
    padding: 14px 16px;
    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(10px);
  }

  .msgInput {
    width: 100%;
    max-height: ${MAX_HEIGHT}px;
    resize: none;
    overflow: auto;
    background: transparent;
    border: none;
    outline: none;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1rem;
    line-height: 1.55;
    margin: 0;
    padding: 0;
  }

  .msgInput::placeholder {
    color: ${({ theme }) => theme.colors.secondary};
  }

  .send {
    --iconBtn: 40px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    align-self: end;
  }

  .msgInput::-webkit-scrollbar {
    width: 10px;
  }

  .msgInput::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: content-box;
  }

  @media (max-width: 600px) {
    .box {
      border-radius: 24px;
      padding: 12px 12px;
      gap: 10px;
    }
  }
`;
