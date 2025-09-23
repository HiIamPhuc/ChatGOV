import React, { useState } from "react";
import styled from "styled-components";
import { useI18n } from "@/app/i18n";
import Button from "@/components/common/buttons/Button";

type Props = {
  onSubmit: (email: string, password: string) => void;
  loading?: boolean;
};

const LoginForm: React.FC<Props> = ({ onSubmit, loading }) => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { t } = useI18n();

  return (
    <StyledWrapper>
      <section className="container">
        <header>{t("signin")}</header>

        <form
          className="form"
          onSubmit={(e) => { e.preventDefault(); onSubmit(email.trim(), pw); }}
        >
          <div className="input-box">
            <label>{t("email")}</label>
            <input
              required
              placeholder="Email của bạn"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-box">
            <label>{t("password")}</label>
            <div className="password">
              <input
                required
                placeholder="Mật khẩu của bạn"
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              <button
                type="button"
                className="toggle"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                title={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPw ? eyeOff : eye}
              </button>
            </div>
          </div>

          <Button type="submit" wfull size="md" disabled={!!loading}>
            {loading ? t("loggingIn") : t("login")}
          </Button>
        </form>
      </section>
    </StyledWrapper>
  );
};

export default LoginForm;

/* ===================== styles (theme light) ===================== */
const StyledWrapper = styled.div`
  display:flex; align-items:center; justify-content:center; padding:20px;

  .container{
    max-width:420px; width:100%;
    background:${({theme})=>theme.colors.surface};
    border:1px solid ${({theme})=>theme.colors.border};
    border-radius:${({theme})=>theme.radii.md};
    padding:24px; box-shadow:${({theme})=>theme.shadow};
  }
  header{
    text-align:center; font-weight:700; font-size:1.2rem;
    color:${({theme})=>theme.colors.primary};
  }
  .form{ margin-top:16px; display:flex; flex-direction:column; gap:16px; }

  .input-box{ width:100%; margin-top:10px; }
  .input-box label{ font-weight:600; color:${({theme})=>theme.colors.primary}; }

  .form :where(.input-box input){
    height:38px; width:100%; outline:none; font-size:1rem;
    color:${({theme})=>theme.colors.primary};
    margin-top:6px; border:1px solid ${({theme})=>theme.colors.border};
    border-radius:10px; padding:0 12px; background:#fff;
    transition:border-color .15s ease, box-shadow .15s ease;
  }
  .input-box input::placeholder{ color:${({theme})=>theme.colors.secondary}; opacity:.8; }
  .input-box input:focus{
    border-color:${({theme})=>theme.colors.accent};
    box-shadow:0 0 0 3px rgba(206,122,88,.2);
  }

  /* password reveal */
  .password{ position:relative; }
  .password input{ padding-right:40px; }
  .toggle{
    position:absolute; right:8px; top:50%; transform:translateY(-50%);
    width:30px; height:30px; border:none; background:transparent; cursor:pointer;
    color:${({theme})=>theme.colors.secondary}; border-radius:8px;
  }
  .toggle:hover{ color:${({theme})=>theme.colors.accent}; background:#fff5ef; }
  .toggle:focus-visible{ outline:3px solid rgba(206,122,88,.35); outline-offset:2px; }
  .toggle svg{ width:18px; height:18px; display:block; }
`;

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
