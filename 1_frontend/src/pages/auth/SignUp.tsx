import { useState } from "react";
import styled from "styled-components";
import { register } from "@/services/auth"; 
import SignupForm from "@/components/forms/SignupForm";
import { Link, useNavigate } from "react-router-dom";
import LoaderPage from "@/components/common/loaders/LoaderPage";
import { useToast } from "@/app/toast";
import { useI18n } from "@/app/i18n";

// ảnh trong /public
const bg = "/signup-bg.jpg";

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { notify } = useToast();
  const { t } = useI18n();

  const submit = async ({ email, password, fullName }: { email: string; password: string; fullName: string; }) => {
    setLoading(true);
    try {
      await register(email, password, fullName);
      notify({ title: t("signupVerify"), tone: "success" });
      nav("/signin");
    } catch (e: any) {
      notify({ title: t("error"), content: e?.response?.data?.detail || e?.message, tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrap $bg={bg}>
      {loading ? (
        <LoaderPage />
      ) : (
        <div className="panel">
          <SignupForm onSubmit={submit} loading={loading} />
          <div className="links">
            <span className="muted">{t("haveAccount")}</span>
            <Link to="/signin" className="cta">
              {t("signin")}
            </Link>
          </div>
        </div>
      )}
    </Wrap>
  );
}

/* ============ styles ============ */
const Wrap = styled.div<{ $bg: string }>`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;

  /* Background image full fill */
  background-image: url(${(p) => p.$bg});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: ${({ theme }) => theme.colors.bg};

  .panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    width: min(100%, 640px);
  }

  .links {
    margin-top: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .muted {
    color: ${({ theme }) => theme.colors.primary};
    font-size: 0.96rem;
  }

  .cta {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
    font-size: 0.96rem;
  }
  .cta:hover {
    color: ${({ theme }) => theme.colors.accent2};
  }
  .cta:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent}59; /* accent + alpha */
    outline-offset: 2px;
  }

  @media (max-width: 480px) {
    padding: 16px;
    background-position: 70% center;
  }
`;
