import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import styled, { keyframes } from "styled-components";

type Tone = "info" | "warn" | "error" | "success";
type Toast = {
  id: string;
  title: string;
  content?: string;
  linkText?: string;
  linkHref?: string;
  tone?: Tone;
};
type ToastCtx = {
  notify: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};
const Ctx = createContext<ToastCtx>({ notify: () => {}, dismiss: () => {} });

export const useToast = () => useContext(Ctx);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  const notify = useCallback((t: Omit<Toast, "id">) => {
    const id = (crypto as any)?.randomUUID?.() || String(Date.now() + Math.random());
    setToasts(prev => [...prev, { id, ...t }]);
  }, []);

  return (
    <Ctx.Provider value={{ notify, dismiss }}>
      {children}
      <Wrap role="region" aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </Wrap>
    </Ctx.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const tone: Tone = toast.tone ?? "info";
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setLeaving(true);
      setTimeout(onDismiss, 320);
    }, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <Item tone={tone}>
      <Card data-leaving={leaving ? "true" : "false"}>
        <div className="text-content">
          <p className="card-heading">{toast.title}</p>
          {!!toast.content && <p className="card-content">{toast.content}</p>}
          {!!toast.linkText && (
            <a href={toast.linkHref ?? "#"} className="card-link">
              {toast.linkText}
            </a>
          )}
          <button
            className="exit-btn"
            onClick={() => { setLeaving(true); setTimeout(onDismiss, 320); }}
            aria-label="Close"
          >
            <svg fill="none" viewBox="0 0 15 15" height={15} width={15} aria-hidden="true">
              <path strokeLinecap="round" strokeWidth={2} stroke="black" d="M1 14L14 1" />
              <path strokeLinecap="round" strokeWidth={2} stroke="black" d="M1 1L14 14" />
            </svg>
          </button>
        </div>
      </Card>
    </Item>
  );
};

/* ================= styles ================= */
const slideIn = keyframes`
  from { transform: translateX(16px); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
`;
const slideOut = keyframes`
  from { transform: translateX(0);     opacity: 1; }
  to   { transform: translateX(16px);  opacity: 0; }
`;

const toneColor: Record<Tone, string> = {
  info: "#60B6FF",
  warn: "#FFB700",
  error: "#FF7373",
  success: "#3AD29F",
};

const OFFSET = 8;   // độ to hơn card khi CHƯA hover (px)
const HOVER  = 10;  // biên độ trượt khi hover (px)

const Wrap = styled.div`
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 9999;
  pointer-events: none;

  /* chừa chỗ cho underlay lớn hơn + trượt */
  padding-top: ${OFFSET}px;
  padding-left: ${OFFSET}px;
  padding-right: ${HOVER + OFFSET}px;
  padding-bottom: ${HOVER + OFFSET}px;
`;


const Item = styled.div<{ tone: Tone }>`
  position: relative;
  display: inline-block;
  pointer-events: auto;

  /* Underlay theo tone: LỚN HƠN card ngay từ đầu (to đều bốn phía) */
  &::before{
    content: "";
    position: absolute;
    inset: -${OFFSET}px;                          
    border-radius: calc(12px + ${OFFSET}px);      
    background: ${({ tone }) => toneColor[tone]};
    z-index: 0;                                    /* dưới Card */
    transform: translate(0, 0);
    transition: transform .3s ease;
  }

  /* Top-right corner: trượt vào-trong để không tràn viewport */
  &:hover::before{
    transform: translate(-${HOVER}px, ${HOVER}px);
  }
`;

/* Card TRÊN: chỉ nền kem, không viền/outline */
const Card = styled.div`
  position: relative;
  z-index: 1;
  width: 320px;
  border-radius: 12px;
  overflow: hidden;

  background: #E9E9E9;

  animation: ${slideIn} 260ms ease-out both;
  &[data-leaving="true"] { animation: ${slideOut} 260ms ease-in both; }

  .text-content{ width:100%; display:flex; flex-direction:column; padding:14px 18px; gap:6px; }
  .card-heading{ font-size:1em; font-weight:800; color:#111; }
  .card-content{ font-size:.95em; font-weight:500; color:#313131; }
  .card-link{ color:#000; font-weight:700; text-decoration: underline; text-underline-offset: 2px; margin-top:4px; }

  .exit-btn{
    position:absolute; right:8px; top:8px; width:30px; height:30px;
    background:transparent; border:none; cursor:pointer; border-radius:8px;
  }
  .exit-btn:hover{ background:#EADABA; }
`;
