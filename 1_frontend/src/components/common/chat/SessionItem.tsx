import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { useI18n } from "@/app/i18n";
import { Pencil, Trash2, MoreVertical } from "lucide-react";

type Props = {
  title: string;
  active?: boolean;
  onClick?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
};

type Pos = { top: number; left: number; arrowTop: number; side: "left" | "right" };

export default function SessionItem({
  title,
  active,
  onClick,
  onRename,
  onDelete,
}: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);

  const rowBtnRef = useRef<HTMLButtonElement | null>(null);
  const dotsRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  // tính vị trí: căn giữa theo nút; ưu tiên RIGHT, fallback LEFT
  const recalc = () => {
    if (!open) return;
    const anchor = dotsRef.current?.getBoundingClientRect();
    const menu = menuRef.current;
    if (!anchor || !menu) return;

    const GAP = 8;
    const MARGIN = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;

    let top = Math.round(anchor.top + anchor.height / 2 - mh / 2);
    top = Math.max(MARGIN, Math.min(top, vh - mh - MARGIN));

    let left = Math.round(anchor.right + GAP);
    let side: "left" | "right" = "left";
    if (left + mw > vw - MARGIN) {
      left = Math.round(anchor.left - GAP - mw);
      if (left < MARGIN) left = MARGIN;
      side = "right";
    }

    const idealArrowTop = Math.round(anchor.top + anchor.height / 2 - top - 6);
    const arrowTop = Math.max(10, Math.min(idealArrowTop, mh - 22));

    setPos({ top, left, arrowTop, side });
  };

  // đo kích thước thật NGAY SAU khi menu mount
  useLayoutEffect(() => {
    if (!open) return;
    recalc();
    window.addEventListener("scroll", recalc, true);
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
    };
  }, [open]);

  const Menu = (
    <MenuWrap
      ref={menuRef}
      data-session-menu
      data-side={pos?.side || "left"}
      style={
        pos
          ? { top: pos.top, left: pos.left, visibility: "visible", ["--arrow-top" as any]: `${pos.arrowTop}px` }
          : { visibility: "hidden", top: 0, left: 0 } // render để đo, nhưng ẩn
      }
      onClick={(e) => e.stopPropagation()}
      role="menu"
    >
      <button className="item" onClick={onRename} role="menuitem">
        <span className="ic" aria-hidden>
          <Pencil size={16} strokeWidth={2} />
        </span>
        <span>{t("rename") || "Đổi tên"}</span>
      </button>

      <div className="sep" aria-hidden />

      <button className="item danger" onClick={onDelete} role="menuitem">
        <span className="ic danger" aria-hidden>
          <Trash2 size={16} strokeWidth={2} />
        </span>
        <span className="danger">{t("delete") || "Xoá"}</span>
      </button>

      <span className="arrow" />
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
          <MoreVertical size={16} strokeWidth={2} />
        </button>
      </button>

      {open && createPortal(Menu, document.body)}
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
    background: rgba(255, 255, 255, 0.6);
    border-radius: var(--r);
    color: ${({ theme }) => theme.colors.accent2};
    cursor: pointer;
    transition: background 0.18s ease, box-shadow 0.18s ease,
      border-color 0.18s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  .accent {
    height: 100%;
    border-radius: var(--r) 0 0 var(--r);
    background: linear-gradient(
      180deg,
      ${({ theme }) => theme.colors.accent} 0%,
      ${({ theme }) => theme.colors.accent2} 100%
    );
    opacity: 0;
    transition: opacity 0.18s ease;
  }

  .tx {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.95rem;
    font-weight: 600;
    text-align: left;
  }

  .rowBtn:hover {
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  }
  .rowBtn:hover .accent { opacity: 0.4; }

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
    box-shadow: 0 0 0 2px rgba(206, 122, 88, 0.28);
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
    transition: background 0.15s ease, color 0.15s ease;
  }
  .dots:hover {
    background: rgba(0, 0, 0, 0.06);
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const MenuWrap = styled.div`
  position: fixed;
  z-index: 1000;
  min-width: 180px;
  padding: 8px;
  visibility: hidden; /* sẽ bật lên = visible khi đã có pos */

  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px) saturate(1.05);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);

  .item {
    width: 100%;
    height: 34px;
    padding: 0 12px;
    border: none;
    background: transparent;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;

    font-weight: 600;
    font-size: 0.92rem;
    color: ${({ theme }) => theme.colors.primary};
    transition: background 0.15s ease, transform 0.08s ease;
  }
  .item:hover { background: rgba(0,0,0,0.05); transform: translateX(1px); }

  .ic { width: 16px; height: 16px; color: ${({ theme }) => theme.colors.secondary}; display: grid; place-items: center; }

  .sep { height: 1px; margin: 6px 6px; background: ${({ theme }) => theme.colors.border}; opacity: .9; border-radius: 1px; }

  .danger, .item.danger .ic { color: ${({ theme }) => theme.colors.danger}; }

  /* mũi tên: dùng data-side để đặt trái/phải */
  .arrow {
    position: absolute;
    top: var(--arrow-top, 10px);
    width: 12px; height: 12px;
    background: inherit;
    transform: rotate(45deg);
    pointer-events: none;
    border-left: 1px solid ${({ theme }) => theme.colors.border};
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 2px 0 0 0;
  }
  &[data-side="left"] .arrow { left: -6px; right: auto; }
  &[data-side="right"] .arrow { right: -6px; left: auto; transform: rotate(225deg); }
`;
