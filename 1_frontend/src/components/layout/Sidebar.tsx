import styled from "styled-components";
import { useI18n } from "@/app/i18n";
import { supabase } from "@/app/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/app/toast";
import React from "react";

type Props = { collapsed: boolean; onToggle: () => void };

export default function Sidebar({ collapsed, onToggle }: Props){
  const { t } = useI18n();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { notify } = useToast();

  const logout = async () => {
    await supabase.auth.signOut();
    notify({ title: t("signin"), content: t("signedOut"), tone:"info" });
    nav("/signin");
  };
  const go = (to: string) => () => nav(to);

  return (
    <Wrap data-collapsed={collapsed ? "true" : "false"}>
      <div className="head">
        {!collapsed && <div className="brand">{t("history")}</div>}
        <button className="collapse" onClick={onToggle} title={collapsed ? "Mở rộng" : "Thu gọn"} aria-label="Toggle sidebar">
          <SvgCollapse className="ic" data-rot={collapsed ? "1" : "0"} />
        </button>
      </div>

      <div className="body">
        <div className="empty">{t("noSessions")}</div>
      </div>

      <nav className="nav">
        <NavBtn onClick={go("/profile")} data-active={pathname.startsWith("/profile") ? "true":"false"} title="Profile">
          <SvgUser className="icon"/><span className="label">Profile</span>
        </NavBtn>
        <NavBtn onClick={go("/settings")} data-active={pathname.startsWith("/settings") ? "true":"false"} title={t("settings")}>
          <SvgSettings className="icon"/><span className="label">{t("settings")}</span>
        </NavBtn>
        <NavBtn onClick={logout} title={t("logout")}>
          <SvgLogout className="icon"/><span className="label">{t("logout")}</span>
        </NavBtn>
      </nav>
    </Wrap>
  );
}

const Wrap = styled.aside`
  height:100%;
  display:flex; flex-direction:column; gap:10px;
  background:${({theme})=>theme.colors.surface};

  .head{ display:flex; align-items:center; gap:8px; padding:12px 10px 0 10px; }
  .brand{ font-weight:800; color:${({theme})=>theme.colors.primary}; flex:1; }

  .collapse{
    height:36px; width:36px; border-radius:10px;
    border:1px solid ${({theme})=>theme.colors.border};
    background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:.2s;
  }
  .collapse:hover{ background:#fff5ef; border-color:#f0d2c5; }
  .ic{ width:18px; height:18px; transition: transform .2s; }
  .ic[data-rot="1"]{ transform: rotate(180deg); }

  .body{ flex:1; min-height:0; overflow:auto; padding:4px 10px 10px; }
  .empty{ font-size:.92rem; color:${({theme})=>theme.colors.secondary}; padding:4px; }

  /* sidebar scrollbar riêng */
  .body::-webkit-scrollbar{ width:10px; }
  .body::-webkit-scrollbar-thumb{
    background:#d6d6d6; border-radius:10px; border:3px solid transparent; background-clip:content-box;
  }
  .body{ scrollbar-width:thin; scrollbar-color:#d6d6d6 transparent; }

  .nav{ padding:10px; display:flex; flex-direction:column; gap:10px; border-top:1px solid ${({theme})=>theme.colors.border}; }

  &[data-collapsed="true"] .brand, &[data-collapsed="true"] .label{ display:none; }
`;

const NavBtn = styled.button`
  --r: 999px;
  display:flex; align-items:center; gap:12px; width:100%;
  padding:12px 14px; border-radius:var(--r);
  border:1px solid ${({theme})=>theme.colors.border};
  background:#fff; color:${({theme})=>theme.colors.primary};
  font-weight:600; cursor:pointer;
  transition: background .2s, box-shadow .2s, color .2s, border-color .2s;

  .icon{ width:22px; height:22px; color:${({theme})=>theme.colors.primary}; transition: color .2s; }

  &:hover{ background:#fff5ef; box-shadow: inset 0 1px 0 rgba(0,0,0,.03); border-color:#f0d2c5; }
  &:focus-visible, &[data-active="true"]{
    outline:none;
    background: linear-gradient(90deg, ${({theme})=>theme.colors.accent}, ${({theme})=>theme.colors.accent2});
    color:#fff; border-color:transparent; box-shadow:0 4px 18px rgba(206,122,88,.35);
  }
  &:focus-visible .icon, &[data-active="true"] .icon{ color:#fff; }
`;

/* SVGs */
const SvgCollapse = (p:React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SvgUser = (p:React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z" fill="currentColor" />
    <path d="M3 20a9 6 0 0 1 18 0v1H3z" fill="currentColor" />
  </svg>
);
const SvgSettings = (p:React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path d="M12 8a4 4 0 1 1-4 4 4 4 0 0 1 4-4Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M2 12h3m14 0h3M12 2v3m0 14v3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M4.2 19.8l2.1-2.1m11.4-11.4 2.1-2.1" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const SvgLogout = (p:React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path d="M10 7V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-3" stroke="currentColor" strokeWidth="2"/>
    <path d="M15 12H3m4-4-4 4 4 4" stroke="currentColor" strokeWidth="2" />
  </svg>
);
