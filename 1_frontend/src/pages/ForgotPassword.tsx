import { useState } from "react";
import styled from "styled-components";
import LoaderPage from "@/components/common/loaders/LoaderPage";
import { supabase } from "@/app/supabaseClient";
import { useToast } from "@/app/toast";
import { useI18n } from "@/app/i18n";
import ForgotForm from "@/components/forms/ForgotPasswordForm";

export default function ForgotPage(){
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();
  const { t } = useI18n();

  const submit = async (email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/signin` : undefined,
    });
    setLoading(false);
    if (error) {
      notify({ title: t("error"), content: error.message, tone: "error" });
      return;
    }
    notify({ title: t("resetSent"), tone:"success" });
  };

  return (
    <Wrap>
      {loading ? (
        <LoaderPage/>
      ) : (
        <div className="card">
          <ForgotForm onSubmit={submit} loading={loading} />
          <div className="links">
            <a href="/signin">{t("haveAccount")} {t("signin")}</a>
            <a href="/signup">{t("needAccount")} {t("signup")}</a>
          </div>
        </div>
      )}
    </Wrap>
  );
}

const Wrap = styled.div`
  min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;
  .card{ display:grid; gap:12px; }
  .links{ display:flex; justify-content:space-between; font-size:.95rem; }
  .links a{ color:#cfcfcf; text-decoration:underline; }
  .links a:hover{ color:#fff; }
`;
