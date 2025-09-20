import React, { createContext, useContext, useState, useCallback } from "react";
import styled from "styled-components";

type Toast = { id: string; title: string; content?: string; linkText?: string; linkHref?: string; tone?: "info"|"warn"|"error"|"success" };
type ToastCtx = { notify: (t: Omit<Toast,"id">) => void; dismiss: (id: string)=>void; };
const Ctx = createContext<ToastCtx>({ notify: ()=>{}, dismiss: ()=>{} });

export const useToast = () => useContext(Ctx);

export const ToastProvider: React.FC<{children:React.ReactNode}> = ({ children }) => {
  const [toasts,setToasts] = useState<Toast[]>([]);
  const notify = useCallback((t: Omit<Toast,"id">) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, ...t }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 6000);
  },[]);
  const dismiss = (id:string) => setToasts(prev => prev.filter(x => x.id!==id));

  return (
    <Ctx.Provider value={{ notify, dismiss }}>
      {children}
      <Wrap>
        {toasts.map(t => (
          <Card key={t.id} tone={t.tone ?? "info"}>
            <div className="text-content">
              <p className="card-heading">{t.title}</p>
              {!!t.content && <p className="card-content">{t.content}</p>}
              {!!t.linkText && <a href={t.linkHref ?? "#"} className="card-link">{t.linkText}</a>}
              <button className="exit-btn" onClick={()=>dismiss(t.id)} aria-label="Close">
                <svg fill="none" viewBox="0 0 15 15" height={15} width={15}>
                  <path strokeLinecap="round" strokeWidth={2} stroke="black" d="M1 14L14 1" />
                  <path strokeLinecap="round" strokeWidth={2} stroke="black" d="M1 1L14 14" />
                </svg>
              </button>
            </div>
          </Card>
        ))}
      </Wrap>
    </Ctx.Provider>
  );
};

const Wrap = styled.div`
  position: fixed; top: 16px; right: 16px; display:flex; flex-direction:column; gap:12px; z-index: 9999;
`;

const Card = styled.div<{tone:"info"|"warn"|"error"|"success"}>`
  width: 320px; background:#fff0d1; position:relative; display:flex; align-items:center; justify-content:center; transition:.3s;
  border-radius: 12px; overflow: hidden; border:1px solid #00000022;
  .text-content{ width:100%; display:flex; flex-direction:column; padding: 14px 18px; gap:4px; }
  .card-heading{ font-size:1em; font-weight:800; color:#111; }
  .card-content{ font-size:.95em; font-weight:500; color:#313131; }
  .card-link{ color:black; font-weight:600; margin-top:6px; }
  .exit-btn{ position:absolute; right:8px; top:8px; width:30px; height:30px; background:transparent; border:none; cursor:pointer; border-radius:8px; }
  .exit-btn:hover{ background:#eadaba; }

  &::before{
    content:"";
    background-color: ${({tone}) => tone==="error" ? "#ff7373" : tone==="warn" ? "#ffb700" : tone==="success" ? "#3ad29f" : "#b5e0ff"};
    width:100%; height:100%; position:absolute; z-index:-1; padding: 4px; transition:.3s;
  }
  &:hover::before{ margin: 18px 0 0 18px; }
`;
