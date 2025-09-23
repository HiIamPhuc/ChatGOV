import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { supabase } from "@/app/supabaseClient";
import { useToast } from "@/app/toast";
import { useI18n } from "@/app/i18n";
import LoaderPage from "@/components/common/loaders/LoaderPage";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/buttons/Button";

export default function ResetPassword(){
  const { notify } = useToast();
  const { t } = useI18n();
  const nav = useNavigate();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setReady(true);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) { notify({ title: t("error"), content: t("passwordTooShort"), tone:"error" }); return; }
    if (pw !== pw2) { notify({ title: t("error"), content: t("confirmPassword"), tone:"error" }); return; }
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: pw });
      setLoading(false);
      if (error) { notify({ title: t("error"), content: error.message, tone:"error" }); return; }
      notify({ title: t("passwordUpdated"), tone:"success" });
      if (typeof window !== "undefined") window.history.replaceState({}, document.title, window.location.pathname);
      nav("/signin");
    } catch (err: any) {
      setLoading(false);
      notify({ title: t("error"), content: err?.message || "Update password failed", tone:"error" });
    }
  };

  if (!ready) return <Page><LoaderPage /></Page>;

  return (
    <Page>
      <section className="container">
        <header>{t("setNewPassword")}</header>
        <form className="form" onSubmit={submit}>
          <div className="input-box">
            <label>{t("newPassword")}</label>
            <div className="password">
              <input type={show1 ? "text" : "password"} placeholder="Mật khẩu mới của bạn" value={pw} onChange={(e)=>setPw(e.target.value)} required />
              <button type="button" className="toggle" onClick={()=>setShow1(s=>!s)} aria-label={show1?"Ẩn":"Hiện"}>{show1 ? eyeOff : eye}</button>
            </div>
          </div>

          <div className="input-box">
            <label>{t("confirmPassword")}</label>
            <div className="password">
              <input type={show2 ? "text" : "password"} placeholder="Xác nhận mật khẩu mới" value={pw2} onChange={(e)=>setPw2(e.target.value)} required />
              <button type="button" className="toggle" onClick={()=>setShow2(s=>!s)} aria-label={show2?"Ẩn":"Hiện"}>{show2 ? eyeOff : eye}</button>
            </div>
          </div>

          <Button type="submit" wfull size="md" disabled={loading}>
            {t("updatePassword")}
          </Button>
        </form>
      </section>
    </Page>
  );
}

const eye = (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const eyeOff = (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path d="M3 3l18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M1 12s4-7 11-7c2.2 0 4.1.6 5.7 1.5M22 12s-4 7-11 7c-2.2 0-4.1-.6-5.7-1.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const Page = styled.div`
  min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;
  background:${({theme})=>theme.colors.bg};

  .container{
    max-width: 520px; width:100%;
    background:${({theme})=>theme.colors.surface};
    border:1px solid ${({theme})=>theme.colors.border};
    border-radius:${({theme})=>theme.radii.md};
    padding:24px; box-shadow:${({theme})=>theme.shadow};
  }
  header{ text-align:center; font-weight:700; font-size:1.2rem; color:${({theme})=>theme.colors.primary}; }

  .form{ margin-top:16px; display:flex; flex-direction:column; gap:16px;  }
  .input-box{ width:100%; margin-top:10px; }
  .input-box label{ font-weight:600; color:${({theme})=>theme.colors.primary}; }

  .password{ position:relative; }
  .password input{
    height:38px; width:100%; margin-top:6px; padding:0 40px 0 12px;
    border:1px solid ${({theme})=>theme.colors.border}; border-radius:10px; background:#fff; color:${({theme})=>theme.colors.primary};
    outline:none; transition:border-color .15s, box-shadow .15s;
  }
  .password input:focus{ border-color:${({theme})=>theme.colors.accent}; box-shadow:0 0 0 3px rgba(206,122,88,.2); }
  .toggle{
    position:absolute; right:8px; top:50%; transform:translateY(-50%);
    width:30px; height:30px; border:none; background:transparent; cursor:pointer;
    color:${({theme})=>theme.colors.secondary}; border-radius:8px;
  }
  .toggle:hover{ color:${({theme})=>theme.colors.accent}; background:#fff5ef; }
`;
