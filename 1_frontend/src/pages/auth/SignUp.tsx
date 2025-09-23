import { useState } from "react";
import styled from "styled-components";
import { supabase } from "@/app/supabaseClient";
import SignupForm from "@/components/forms/SignupForm";
import { Link, useNavigate } from "react-router-dom";
import LoaderPage from "@/components/common/loaders/LoaderPage";
import { useToast } from "@/app/toast";
import { useI18n } from "@/app/i18n";

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
    notify({ title: t("signupVerify"), tone:"success" });
    if (data.user) nav("/signin");
  };

  return (
    <Wrap>
      {loading ? <LoaderPage /> : (
        <div className="panel">
          <SignupForm onSubmit={submit} loading={loading}/>
          <div className="links">
            <span className="muted">{t("haveAccount")}</span>
            <Link to="/signin" className="cta">{t("signin")}</Link>
          </div>
        </div>
      )}
    </Wrap>
  );
}

const GOV = { bg:"#f5f5f5", muted:"#6b6b6b", accent:"#ce7a58", accent2:"#903938" };

const Wrap = styled.div`
  min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; background:${GOV.bg};

  .panel{ display:flex; flex-direction:column; align-items:center; gap:14px; width:min(100%, 680px); }

  .links{ display:flex; align-items:center; justify-content:center; gap:10px; }
  .muted{ color:${GOV.muted}; font-size:.96rem; }
  .cta{ color:${GOV.accent}; font-weight:700; text-decoration:underline; text-underline-offset:2px; }
  .cta:hover{ color:${GOV.accent2}; }
  .cta:focus-visible{ outline:3px solid rgba(206,122,88,.35); outline-offset:2px; }
`;
