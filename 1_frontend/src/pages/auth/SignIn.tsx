import { useState } from "react";
import styled from "styled-components";
import { login } from "@/services/auth";
import LoginForm from "@/components/forms/LoginForm";
import { Link, useNavigate } from "react-router-dom";
import LoaderPage from "@/components/common/loaders/LoaderPage";
import { useToast } from "@/app/toast";
import { useI18n } from "@/app/i18n";
import { formatError } from "@/utils/formatError";

// ảnh /public
const bg = "/login-bg.jpg";

export default function SignIn() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();
  const { t } = useI18n();

  const submit = async (email: string, password: string) => {
    setLoading(true);
    try {
      await login(email, password);
      notify({ title: t("signinSuccess"), tone: "success" });
      nav("/app");
    } catch (e: any) {
      notify({ title: t("error"), content: formatError(e), tone: "error" });
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
          <LoginForm onSubmit={submit} loading={loading} />
          <div className="links">
            <div className="row">
              <span className="muted">{t("needAccount")}</span>
              <Link to="/signup" className="cta">
                {t("signup")}
              </Link>
            </div>
            <div className="row">
              <Link to="/forgot" className="cta">
                {t("forgot")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </Wrap>
  );
}

const Wrap = styled.div<{ $bg: string }>`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  isolation: isolate;

  /* ===== Background image full fill ===== */
  background-image: url(${(p) => p.$bg});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  /* fallback màu nếu ảnh chưa tải */
  background-color: ${({ theme }) => theme.colors.bg};

  /* Overlay nhẹ để form dễ đọc */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.08);
    z-index: -1;
  }

  .panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    width: min(100%, 640px);
    backdrop-filter: saturate(120%) blur(1px);
  }

  .links {
    margin-top: 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .row {
    display: flex;
    align-items: baseline;
    gap: 6px;
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
  /* dùng alpha-hex 0x59 ≈ 0.35 để bám màu accent của theme */
  .cta:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent}59;
    outline-offset: 2px;
  }

  @media (max-width: 480px) {
    padding: 16px;
    background-position: 70% center;
  }
`;
