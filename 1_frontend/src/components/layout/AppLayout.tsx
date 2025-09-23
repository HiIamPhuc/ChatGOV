import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import Sidebar from "@/components/layout/Sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { useI18n } from "@/app/i18n";

export default function AppLayout() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const isChat = pathname.startsWith("/app"); // dùng để ẩn/hiện menu 3 chấm

  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("sbCollapsed") === "1");
    } catch {}
  }, []);

  const toggle = () =>
    setCollapsed((v) => {
      const n = !v;
      try {
        localStorage.setItem("sbCollapsed", n ? "1" : "0");
      } catch {}
      return n;
    });

  // đóng menu khi click ra ngoài
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // TODO: xử lý xóa chat hiện tại
  const onDelete = () => {
    setMenuOpen(false);
    /* code */
  };

  return (
    <Shell data-collapsed={collapsed ? "true" : "false"}>
      <aside className="rail">
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </aside>

      <section className="main">
        {/* Header overlay trong suốt cho các trang */}
        <Topbar>
          <div className="chrome">
            <div className="title">{t("appTitle")}</div>

            {isChat && (
              <div className="actions" ref={menuRef}>
                <button
                  className="kebab"
                  aria-label="More actions"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="5" r="2" fill="currentColor" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                    <circle cx="12" cy="19" r="2" fill="currentColor" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="menu" role="menu">
                    <button
                      className="item danger"
                      onClick={onDelete}
                      role="menuitem"
                    >
                      <span className="icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24">
                          <path fill="none" d="M0 0h24v24H0z" />
                          <path
                            fill="currentColor"
                            d="M7 7h10l-1 13.01A2 2 0 0 1 14.01 22H9.99A2 2 0 0 1 8 20.01L7 7Zm4-4h2a2 2 0 0 1 2 2v1h3a1 1 0 1 1 0 2H5a1 1 0 1 1 0-2h3V5a2 2 0 0 1 2-2Zm0 3h2V5a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1Zm-1.5 5a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Zm5 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Z"
                          />
                        </svg>
                      </span>
                      <span className="label">Delete</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Topbar>

        <div className="content">
          <Outlet />
        </div>
      </section>
    </Shell>
  );
}

/* =============== styles =============== */
const Shell = styled.div`
  --rail: 280px;
  --rail-collapsed: 68px;

  height: 100vh;
  display: grid;
  grid-template-columns: var(--rail) 1fr;
  overflow: hidden;

  &[data-collapsed="true"] {
    grid-template-columns: var(--rail-collapsed) 1fr;
  }

  .rail {
    height: 100%;
    overflow: hidden;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surface};
  }

  .main {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .content {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: ${({ theme }) => theme.colors.bg};
  }
`;

/* Header overlay trong suốt cho các trang */
const Topbar = styled.header`
  position: absolute;
  inset: 0 0 auto 0;
  height: 60px;
  z-index: 5;
  pointer-events: none; /* cho phép click xuyên qua header */

  .chrome {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0 16px;

    /* trong suốt hoàn toàn, không chặn click */
    border-bottom: 0;
    background: transparent;
    backdrop-filter: none;
    color: ${({ theme }) => theme.colors.accent2};
    font-weight: 800;

    pointer-events: none; /* không chặn nội dung bên dưới */
  }

  /* Khu vực actions vẫn nhận tương tác */
  .actions {
    position: relative;
    pointer-events: auto;
  }
  .actions * {
    pointer-events: auto;
  }

  .kebab {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 999px;
    background: #fff;
    color: ${({ theme }) => theme.colors.accent2};
    cursor: pointer;
    transition: 0.2s;
  }
  .kebab:hover {
    background: #fff5ef;
    border-color: #f0d2c5;
    box-shadow: 0 0 0 2px rgba(206, 122, 88, 0.18) inset;
  }

  .menu {
    position: absolute;
    right: 0;
    top: 44px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: #fff;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12);
    padding: 8px;
    min-width: 180px;
    z-index: 10;
  }

  .menu .item {
    height: 36px;
    padding: 0 10px;
    border: none;
    background: none;
    text-align: left;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.primary};
    transition: transform 0.15s ease, background-color 0.15s ease,
      color 0.15s ease;
  }
  .menu .item:hover {
    background: #fff5ef;
    transform: translateX(2px);
    color: ${({ theme }) => theme.colors.accent};
  }

  .menu .item .icon {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.secondary};
  }

  .menu .danger {
    color: ${({ theme }) => theme.colors.danger};
  }
  .menu .danger .icon {
    color: ${({ theme }) => theme.colors.danger};
  }
`;
