import styled from "styled-components";
import { useI18n } from "@/app/i18n";
import { supabase } from "@/app/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/app/toast";

export default function Sidebar(){
  const { lang, setLang, t } = useI18n();
  const nav = useNavigate();
  const { notify } = useToast();

  const logout = async () => {
    await supabase.auth.signOut();
    notify({ title: t("signinSuccess"), content: t("signedOut"), tone:"info" });
    nav("/signin");
  };

  return (
    <Wrap>
      <div className="section">
        <div className="title">{t("history")}</div>
        <div className="empty">{t("noSessions")}</div>
      </div>

      <div className="spacer" />

      <div className="section settings">
        <div className="title">{t("settings")}</div>
        <div className="row">
          <label htmlFor="lang">{t("language")}</label>
          <select id="lang" value={lang} onChange={e=>setLang(e.target.value as any)}>
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </div>
        <button className="logout" onClick={logout}>{t("logout")}</button>
      </div>
    </Wrap>
  );
}

const Wrap = styled.aside`
  height:100%;
  padding:14px;
  border-right:1px solid #1b1f26;
  background:#0e1116;
  display:flex; flex-direction:column; gap:18px;

  .spacer { flex:1; }

  .title{ font-weight:600; margin-bottom:10px; color:#e6edf3; }
  .empty{ font-size:.92rem; color:#8b98a5;}
  .row{
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    background:#121720; padding:10px; border-radius:12px; border:1px solid #1b2430;
    color:#e6edf3;
  }
  select{
    background:#0f141b; color:#e6edf3; border:1px solid #2a3441;
    border-radius:8px; padding:6px 8px;
  }
  .logout{
    width:100%; margin-top:10px; padding:10px 12px; border-radius:12px;
    border:1px solid #2a3441; background:#0f141b; color:#e6edf3; cursor:pointer;
  }
  .logout:hover{ background:#111a24; }
`;
