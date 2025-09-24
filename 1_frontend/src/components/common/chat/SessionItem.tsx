import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { useI18n } from "@/app/i18n";

type Props = {
  title: string;
  active?: boolean;
  onClick?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
};

export default function SessionItem({
  title,
  active,
  onClick,
  onRename,
  onDelete,
}: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const rowBtnRef = useRef<HTMLButtonElement | null>(null);
  const dotsRef = useRef<HTMLButtonElement | null>(null);

  // focus khi active
  useEffect(() => {
    if (!active) return;
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => rowBtnRef.current?.focus());
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id1);
  }, [active]);

  // đóng menu khi click ra ngoài
  useEffect(() => {
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const inAnchor = dotsRef.current?.contains(target);
      const inMenu = (target as HTMLElement).closest?.("[data-session-menu]");
      if (!inAnchor && !inMenu) close();
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // tính vị trí menu
  useEffect(() => {
    if (!open) return;
    const calc = () => {
      const b = dotsRef.current?.getBoundingClientRect();
      if (!b) return;
      setPos({ top: Math.round(b.bottom + 6), left: Math.round(b.right) });
    };
    calc();
    window.addEventListener("scroll", calc, true);
    window.addEventListener("resize", calc);
    return () => {
      window.removeEventListener("scroll", calc, true);
      window.removeEventListener("resize", calc);
    };
  }, [open]);

  const Menu = (
    <MenuWrap
      data-session-menu
      style={{ top: (pos?.top ?? 0) + "px", left: (pos?.left ?? 0) + "px" }}
      onClick={(e) => e.stopPropagation()}
      role="menu"
    >
      <button className="item" onClick={onRename} role="menuitem">
        <span className="ic" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" />
          </svg>
        </span>
        <span>{t("rename") || "Rename"}</span>
      </button>

      <button className="item danger" onClick={onDelete} role="menuitem">
        <span className="ic" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M6 7h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7zm3-4h6l1 2h3a1 1 0 1 1 0 2H5a1 1 0 1 1 0-2h3l1-2z" fill="currentColor" />
          </svg>
        </span>
        <span>{t("delete") || "Delete"}</span>
      </button>
    </MenuWrap>
  );

  return (
    <Row $active={!!active}>
      <button
        ref={rowBtnRef}
        className="rowBtn"
        title={title}
        onClick={onClick}
      >
        <span className="accent" aria-hidden />
        <span className="tx">{title}</span>
        <button
          ref={dotsRef}
          className="dots"
          aria-label={t("more") || "More"}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="2" fill="currentColor" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <circle cx="12" cy="19" r="2" fill="currentColor" />
          </svg>
        </button>
      </button>

      {open && pos && createPortal(Menu, document.body)}
    </Row>
  );
}

/* ============ styles ============ */
const Row = styled.div<{ $active: boolean }>`
  .rowBtn {
    --r: 10px;
    width: 100%;
    display: grid;
    grid-template-columns: 4px 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border: 1px solid transparent;
    background: rgba(255,255,255,0.6);
    border-radius: var(--r);
    color: ${({ theme }) => theme.colors.accent2};
    cursor: pointer;
    transition: background .18s ease, box-shadow .18s ease, border-color .18s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }

  .accent {
    height: 100%;
    border-radius: var(--r) 0 0 var(--r);
    background: linear-gradient(180deg, ${({ theme }) => theme.colors.accent} 0%, ${({ theme }) => theme.colors.accent2} 100%);
    opacity: 0;
    transition: opacity .18s ease;
  }

  .tx {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: .95rem;
    font-weight: 600;
    text-align: left;
  }

  .rowBtn:hover {
    background: rgba(255,255,255,0.9);
    box-shadow: 0 4px 14px rgba(0,0,0,.08);
  }
  .rowBtn:hover .accent { opacity: .4; }

  ${({ $active, theme }) =>
    $active &&
    `.rowBtn {
        background: #fff;
        border-color: ${theme.colors.border};
        box-shadow: 0 6px 16px rgba(0,0,0,.1);
      }
      .accent { opacity: .9; }
    `}

  .rowBtn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(206,122,88,.28);
  }

   .dots {
    display: grid; 
    place-items: center;
    width: 28px; 
    height: 28px;
    border: none;             
    background: transparent;  
    border-radius: 6px;
    color: ${({ theme }) => theme.colors.secondary};
    cursor: pointer;
    transition: background .15s ease, color .15s ease;
  }
  .dots:hover {
    background: rgba(0,0,0,0.06); 
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const MenuWrap = styled.div`
  position: fixed;
  transform: translateX(-100%);
  z-index: 1000;
  min-width: 170px;
  background: #fff;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(0,0,0,.12);
  padding: 6px;

  .item {
    width: 100%;
    height: 34px;
    padding: 0 10px;
    border: none;
    background: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.92rem;
    color: ${({ theme }) => theme.colors.primary};
    transition: background 0.15s ease, transform 0.12s ease;
  }
  .item:hover {
    background: #fff5ef;
    transform: translateX(2px);
  }
  .ic {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.colors.secondary};
    display: grid;
    place-items: center;
  }
  .item.danger {
    color: ${({ theme }) => theme.colors.danger};
  }
  .item.danger .ic {
    color: ${({ theme }) => theme.colors.danger};
  }
`;
