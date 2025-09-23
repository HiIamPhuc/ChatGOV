import { useState } from "react";
import styled from "styled-components";
import { supabase } from "@/app/supabaseClient";
import LoginForm from "@/components/forms/LoginForm";
import { Link, useNavigate } from "react-router-dom";
import LoaderPage from "@/components/common/loaders/LoaderPage";
import { useToast } from "@/app/toast";
import { useI18n } from "@/app/i18n";

export default function SignIn(){
  const nav = useNavigate();
  const [loading,setLoading] = useState(false);
  const { notify } = useToast();
  const { t } = useI18n();

  const submit = async (email:string, password:string)=>{
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      notify({ title: t("error"), content: error.message, tone:"error" });
      return;
    }
    notify({ title: t("signinSuccess"), tone:"success" });
    nav("/app");
  };

  return (
    <Wrap>
      {loading ? <LoaderPage /> : (
        <div className="panel">
          <LoginForm onSubmit={submit} loading={loading}/>
          <div className="links">
            <div className="row">
              <span className="muted">{t("needAccount")}</span>
              <Link to="/signup" className="cta">{t("signup")}</Link>
            </div>
            <div className="row">
              <Link to="/forgot" className="cta">{t("forgot")}</Link>
            </div>
          </div>
        </div>
      )}
    </Wrap>
  );
}

const GOV = {
  bg:"#f5f5f5",
  muted:"#6b6b6b",
  accent:"#ce7a58",
  accent2:"#903938",
};

const Wrap = styled.div`
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:24px;
  background:${GOV.bg};

  .panel{
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:14px;
    width:min(100%, 640px);
  }

  .links{
    margin-top:2px;
    display:flex;
    flex-direction:column;     /* ✅ 2 dòng */
    align-items:center;
    gap:8px;
  }

  .row{
    display:flex;
    align-items:baseline;
    gap:6px;
  }

  .muted{ color:${GOV.muted}; font-size:.96rem; }

  .cta{
    color:${GOV.accent};
    font-weight:700;
    text-decoration:underline;
    text-underline-offset:2px;
    font-size:.96rem;
  }
  .cta:hover{ color:${GOV.accent2}; }
  .cta:focus-visible{ outline:3px solid rgba(206,122,88,.35); outline-offset:2px; }
`;
