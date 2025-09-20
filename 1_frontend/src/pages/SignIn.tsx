import { useState } from "react";
import styled from "styled-components";
import { supabase } from "../app/supabaseClient";
import LoginForm from "../components/forms/LoginForm";
import { Link, useNavigate } from "react-router-dom";
import LoaderPage from "../components/common/loaders/LoaderPage";
import { useToast } from "../app/toast";
import { useI18n } from "../app/i18n";

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
        <div className="card">
          <LoginForm onSubmit={submit} loading={loading}/>
          <div className="hint">{t("needAccount")} <Link to="/signup">{t("signup")}</Link></div>
          <div className="hint"><Link to="/forgot">{t("forgot")}</Link></div>
        </div>
      )}
    </Wrap>
  );
}
const Wrap = styled.div`
  min-height:100vh; display:flex; align-items:center; justify-content:center; padding: 24px;
  .card{ display:flex; flex-direction:column; align-items:center; gap:12px; }
  .hint{ color:#bdbdbd; font-size:.95rem; }
`;
