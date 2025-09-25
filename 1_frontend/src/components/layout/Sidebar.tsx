import styled from "styled-components";
import { useI18n } from "@/app/i18n";
import { logout as apiLogout } from "@/services/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/app/toast";
import React from "react";
import SessionList, { type Session } from "@/components/common/chat/SessionList";

type Props = { collapsed: boolean; onToggle: () => void };

// /public
const SIDEBAR_BG = "/banner.jpg";
const LOGO = "/logo.png";

export default function Sidebar({ collapsed, onToggle }: Props) {
  const { t } = useI18n();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { notify } = useToast();

  const handleLogout = async () => {
    try {
      await apiLogout();
      notify({ title: t("signin"), content: t("signedOut"), tone: "info" });
      nav("/signin");
    } catch (e: any) {
      notify({
        title: t("error"),
        content: e?.response?.data?.detail || e?.message,
        tone: "error",
      });
    }
  };
  const go = (to: string) => () => nav(to);

  // demo handlers
  const onNewChat = () => nav("/app");
  const onSearch = () => notify({ title: t("searchChats"), tone: "info" });

  // mock data (2 sessions)
  const items: Session[] = [
    { id: "s1", title: "Hướng dẫn CCCD", active: true },
    { id: "s2", title: "Tra cứu hộ chiếu" },
  ];

  const onSelect = (id: string) => nav("/app"); // demo
  const onRename = (id: string) =>
    notify({ title: t("rename") || "Rename", content: id, tone: "info" });
  const onDelete = (id: string) =>
    notify({ title: t("delete") || "Delete", content: id, tone: "info" });

  return (
    <Wrap data-collapsed={collapsed ? "true" : "false"} $bg={SIDEBAR_BG}>
      {/* Header */}
      <div className="head">
        <button className="logo" onClick={go("/app")} aria-label="Home">
          <img src={LOGO} alt="Logo" className="logo-img" />
        </button>
        <button
          className="toggle"
          onClick={onToggle}
          title={collapsed ? t("expand") : t("collapse")}
          aria-label="Toggle sidebar"
        >
          <SvgTwoPanes className="toggle-ic" data-rot={collapsed ? "1" : "0"} />
        </button>
      </div>

      <div className="body">
        {/* Quick actions */}
        <div className="quick">
          <QuickBtn onClick={onNewChat} title={t("newChat")}>
            <SvgPen className="qicon" />
            <span className="qlabel">{t("newChat")}</span>
          </QuickBtn>
          <QuickBtn onClick={onSearch} title={t("searchChats")}>
            <SvgSearch className="qicon" />
            <span className="qlabel">{t("searchChats")}</span>
          </QuickBtn>
        </div>

        {/* Chats block */}
        <div className="sessionsWrap">
          <div className="sectionTitle">{t("chats")}</div>
          <div className="sessionsArea">
            <SessionList
              items={items}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <nav className="footer">
        <NavBtn
          onClick={go("/profile")}
          data-active={pathname.startsWith("/profile") ? "true" : "false"}
          title={t("profile")}
        >
          <SvgUser className="icon" />
          <span className="label">{t("profile")}</span>
        </NavBtn>
        <NavBtn
          onClick={go("/settings")}
          data-active={pathname.startsWith("/settings") ? "true" : "false"}
          title={t("settings")}
        >
          <SvgSettings className="icon" />
          <span className="label">{t("settings")}</span>
        </NavBtn>
        <NavBtn onClick={handleLogout} title={t("logout")}>
          <SvgLogout className="icon" />
          <span className="label">{t("logout")}</span>
        </NavBtn>
      </nav>
    </Wrap>
  );
}

/* ============================= styles ============================= */
const Wrap = styled.aside<{ $bg: string }>`
  --sep: ${({ theme }) => theme.colors.border};

  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto; /* head / body / footer */
  position: relative;

  background-image: url(${(p) => p.$bg});
  background-size: cover;
  background-position: center left;
  background-repeat: no-repeat;
  background-attachment: local;
  background-color: ${({ theme }) => theme.colors.surface};

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.05);
    pointer-events: none;
  }

  .head {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 10px 8px 10px;
    height: 52px;
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.08),
      rgba(255, 255, 255, 0)
    );
  }

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .toggle {
    width: 50px;
    height: 50px;
    border: none;
    background: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.accent2};
    border-radius: 8px;
    transition: transform 0.18s, box-shadow 0.18s, background 0.18s;
  }
  .toggle:hover {
    transform: scale(1.06);
    background: rgba(255, 255, 255, 0.14);
    box-shadow: 0 0 0 2px rgba(206, 122, 88, 0.35) inset;
  }
  .toggle-ic {
    width: 25px;
    height: 25px;
    transition: transform 0.2s;
  }
  .toggle-ic[data-rot="1"] {
    transform: rotate(180deg);
  }

  &[data-collapsed="true"] {
    .toggle {
      opacity: 0;
      pointer-events: none;
      position: absolute;
      right: 10px;
    }
    .logo { opacity: 1; }
    .head:hover .toggle { opacity: 1; pointer-events: auto; }
    .head:hover .logo { opacity: 0; }

    .sessionsWrap { display: none; } /* ẩn khối chats khi thu gọn */
    .label { display: none; }
  }

  /* Body */
  .body {
    z-index: 1;
    min-height: 0;
    display: grid;
    grid-template-rows: auto 1fr; /* quick / sessions */
    gap: 10px;
    padding: 6px 10px;
  }

  .quick {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .sessionsWrap {
    display: grid;
    grid-template-rows: auto 1fr;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--sep);
    min-height: 0;
  }
  .sessionsArea { min-height: 0; } /* cho phép con scroll  */
  .sectionTitle {
    font-size: 0.99rem;
    font-weight: 1000;
    letter-spacing: 0.02em;
    color: color-mix(in srgb, ${({ theme }) => theme.colors.accent2} 75%, black);
    opacity: 1;
    margin: 6px 4px 8px;
    text-shadow: 0 1px 2px rgba(255,255,255,0.6);


  }

  .footer {
    z-index: 1;
    padding: 8px 10px 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-top: 1px solid var(--sep);
    background: transparent;
  }

  @media (max-width: 920px) {
    background-position: center;
  }
`;

/* Quick actions */
const QuickBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s, transform 0.18s;

  .qicon {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.accent};
  }
  &:hover {
    background: rgba(255, 255, 255, 0.96);
    border-color: #f0d2c5;
    transform: translateY(-1px);
  }
  [data-collapsed="true"] & { justify-content: center; }
  [data-collapsed="true"] & .qlabel { display: none; }
`;

/* Footer buttons – gradient border khớp với fill */
const NavBtn = styled.button`
  --r: 999px;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--r);
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s, color 0.2s, border-color 0.2s;

  .icon {
    width: 22px;
    height: 22px;
    color: ${({ theme }) => theme.colors.accent2};
    transition: color 0.2s;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.98);
    box-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.03);
    border-color: #f0d2c5;
  }

  /* ACTIVE / FOCUS: cùng 1 hướng gradient cho CẢ border và fill */
  &:focus-visible,
  &[data-active="true"] {
    outline: none;
    border: 1px solid transparent;
    background:
      linear-gradient(
        90deg,
        ${({ theme }) => theme.colors.accent},
        ${({ theme }) => theme.colors.accent2}
      ) padding-box,
      linear-gradient(
        90deg,
        ${({ theme }) => theme.colors.accent},
        ${({ theme }) => theme.colors.accent2}
      ) border-box;
    background-clip: padding-box, border-box;
    color: #fff;
    box-shadow: 0 4px 18px rgba(206, 122, 88, 0.35);
  }
  &:focus-visible .icon,
  &[data-active="true"] .icon {
    color: #fff;
  }

  [data-collapsed="true"] & {
    justify-content: center;
    padding: 10px 0;
    border-radius: 12px;
  }
`;

/* SVGs */
const SvgTwoPanes = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <rect x="3" y="5" width="8" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
    <rect x="13" y="5" width="8" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const SvgPen = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path d="M12 20h9" strokeWidth="2" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeWidth="2" />
  </svg>
);
const SvgSearch = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <circle cx="11" cy="11" r="7" strokeWidth="2" />
    <path d="M20 20l-3.5-3.5" strokeWidth="2" />
  </svg>
);
const SvgUser = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z" strokeWidth="2" />
    <path d="M3 20a9 6 0 0 1 18 0v1H3z" strokeWidth="2" />
  </svg>
);

const SvgSettings = (p: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    {/* bánh răng 6 răng đối xứng */}
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09c.7 0 1.31-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06c.51.51 1.23.66 1.82.33.46-.26 1-.81 1-1.51V3a2 2 0 0 1 4 0v.09c0 .7.4 1.31 1 1.51.59.33 1.31.18 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.36.36-.48.9-.33 1.82.2.59.81 1 1.51 1H21a2 2 0 0 1 0 4h-.09c-.7 0-1.31.4-1.51 1Z" />
  </svg>
);




const SvgLogout = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path d="M10 7V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-3" stroke="currentColor" strokeWidth="2" />
    <path d="M15 12H3m4-4-4 4 4 4" stroke="currentColor" strokeWidth="2" />
  </svg>
);
