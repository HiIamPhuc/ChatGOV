import { useState } from "react";
import styled from "styled-components";
import { supabase } from "../app/supabaseClient";
import SignupForm from "../components/forms/SignupForm";
import { Link, useNavigate } from "react-router-dom";
import LoaderPage from "../components/common/loaders/LoaderPage";
import { useToast } from "../app/toast";
import { useI18n } from "../app/i18n";

export default function SignUp(){
  const [loading,setLoading] = useState(false);
  const nav = useNavigate();
  const { notify } = useToast();
  const { t } = useI18n();

  const submit = async ({email, password, fullName}:{email:string;password:string;fullName:string})=>{
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({ email, password, options:{ data:{ fullName } } });
    setLoading(false);
    if (error) { notify({ title:t("error"), content:error.message, tone:"error" }); return; }
    // Supabase yêu cầu verify email
    notify({ title: t("signupVerify"), tone:"success" });
    if (data.user) nav("/signin");
  };

  return (
    <Wrap>
      {loading ? <LoaderPage /> : (
        <div className="card">
          <SignupForm onSubmit={submit} loading={loading}/>
          <div className="hint">{t("haveAccount")} <Link to="/signin">{t("signin")}</Link></div>
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
