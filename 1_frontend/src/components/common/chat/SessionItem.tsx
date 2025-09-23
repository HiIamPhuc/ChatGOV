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

  // tính vị trí menu dựa trên nút 3 chấm
  useEffect(() => {
    if (!open) return;
    const calc = () => {
      const b = dotsRef.current?.getBoundingClientRect();
      if (!b) return;
      setPos({ top: Math.round(b.bottom + 6), left: Math.round(b.right) });
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (rowBtnRef.current) ro.observe(rowBtnRef.current);
    window.addEventListener("scroll", calc, true);
    window.addEventListener("resize", calc);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", calc, true);
      window.removeEventListener("resize", calc);
    };
  }, [open]);

  const Menu = (
    <MenuWrap
      data-session-menu
      style={{ top: (pos?.top ?? 0) + "px", left: (pos?.left ?? 0) + "px" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="item" onClick={onRename} role="menuitem">
        <span className="ic" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span>{t("rename") || "Rename"}</span>
      </button>

      <button className="item danger" onClick={onDelete} role="menuitem">
        <span className="ic" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              d="M6 7h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7zm3-4h6l1 2h3a1 1 0 1 1 0 2H5a1 1 0 1 1 0-2h3l1-2z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span>{t("delete") || "Delete"}</span>
      </button>
    </MenuWrap>
  );

  return (
    <Row $active={!!active}>
      {/* CẢ KHỐI là 1 button */}
      <button
        ref={rowBtnRef}
        className="rowBtn"
        title={title}
        onClick={onClick}
        data-active={active ? "true" : "false"}
      >
        <span className="tx">{title}</span>

        {/* Nút 3 chấm nằm trong khối, nhưng stopPropagation để không kích hoạt onClick của khối */}
        <button
          ref={dotsRef}
          className="dots"
          aria-label={t("more") || "More"}
          title={t("more") || "More"}
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
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    text-align: left;
    gap: 8px;
    padding: 8px 6px 8px 10px;
    border: none;
    background: transparent;
    border-radius: 8px;
    color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    transition: background 0.15s ease, box-shadow 0.15s ease,
      border-color 0.15s ease;
  }
  .tx {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.92rem;
    font-weight: 600;
  }

  /* Hover & Active phủ khối */
  .rowBtn:hover {
    background: rgba(255, 255, 255, 0.6);
  }
  ${({ $active }) => $active && `.rowBtn{ background: rgba(255,255,255,.80); }`}

  /* Focus khối */
  .rowBtn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(206, 122, 88, 0.28);
  }

  /* Nút 3 chấm trong khối – trong suốt, chỉ để bắt click */
  .dots {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid transparent;
    background: transparent;
    border-radius: 8px;
    color: ${({ theme }) => theme.colors.secondary};
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
  .rowBtn:hover .dots {
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
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
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
