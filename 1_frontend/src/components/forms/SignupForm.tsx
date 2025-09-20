import React, { useState } from "react";
import styled from "styled-components";
import { useI18n } from "@/app/i18n";

type Props = {
  onSubmit: (p: { email: string; password: string; fullName: string }) => void;
  loading?: boolean;
};

const SignupForm: React.FC<Props> = ({ onSubmit, loading }) => {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [name, setName] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) {
      alert(`${t("error")}: ${t("confirmPassword")}`);
      return;
    }
    onSubmit({ email: email.trim(), password: pw, fullName: name.trim() });
  };

  return (
    <StyledWrapper>
      <form className="form" onSubmit={submit}>
        <p id="heading">{t("signup")}</p>

        <div className="field">
          <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
          <input
            required
            placeholder={t("fullName")}
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v1l10 6 10-6V6c0-1.1-.9-2-2-2zm0 5.2l-8 4.8-8-4.8V18c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V9.2z"/>
          </svg>
          <input
            required
            type="email"
            placeholder={t("email")}
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
          </svg>
          <input
            required
            type="password"
            placeholder={t("password")}
            className="input-field"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </div>

        <div className="field">
          <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
          </svg>
          <input
            required
            type="password"
            placeholder={t("confirmPassword")}
            className="input-field"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
          />
        </div>

        <div className="btn">
          <button disabled={!!loading} className="button1" type="submit">
            {loading ? t("creating") : t("createAccount")}
          </button>
        </div>
      </form>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 2em;
    background: #171717;
    border-radius: 24px;
    border: 1px solid #2c2c2c;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    width: min(92vw, 460px);
  }
  #heading {
    text-align: center;
    margin: 0.5em 0 1em;
    color: #fff;
    font-size: 1.25em;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 0.6em;
    border-radius: 16px;
    padding: 0.8em 0.9em;
    background: #1f1f1f;
    box-shadow: inset 2px 5px 10px rgba(0, 0, 0, 0.35);
  }
  .input-icon {
    width: 1.3em;
    height: 1.3em;
    fill: #fff;
  }
  .input-field {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: #d3d3d3;
    font-size: 0.95rem;
  }
  .btn {
    display: flex;
    justify-content: center;
    margin-top: 1.2em;
  }
  .button1 {
    padding: 0.7em 1.6em;
    border-radius: 12px;
    border: 1px solid #2c2c2c;
    background: #252525;
    color: #fff;
    transition: 0.25s;
  }
  .button1:hover {
    background: #000;
  }
  .button1:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default SignupForm;
