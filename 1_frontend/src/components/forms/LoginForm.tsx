import React, { useState } from "react";
import styled from "styled-components";
import { useI18n } from "@/app/i18n";

type Props = {
  onSubmit: (email: string, password: string) => void;
  loading?: boolean;
};

const LoginForm: React.FC<Props> = ({ onSubmit, loading }) => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const { t } = useI18n();

  return (
    <StyledWrapper>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(email.trim(), pw);
        }}
      >
        <p id="heading">{t("signin")}</p>

        <div className="field">
          <svg
            className="input-icon"
            xmlns="http://www.w3.org/2000/svg"
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
          <input
            required
            placeholder={t("email")}
            className="input-field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <svg
            className="input-icon"
            xmlns="http://www.w3.org/2000/svg"
            width={16}
            height={16}
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
          </svg>
          <input
            required
            placeholder={t("password")}
            className="input-field"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </div>

        <div className="btn">
          <button disabled={!!loading} className="button1" type="submit">
            {loading ? t("loggingIn") : t("login")}
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
    background: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.radii.lg};
    transition: 0.3s;
    box-shadow: ${({ theme }) => theme.shadow};
    border: 1px solid ${({ theme }) => theme.colors.border};
    min-width: 320px;
    width: min(92vw, 420px);
  }
  .form:hover {
    transform: translateY(-2px);
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
    background: ${({ theme }) => theme.colors.surface2};
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
    margin-top: 1.6em;
  }
  .button1,
  .button3 {
    padding: 0.7em 1.4em;
    border-radius: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border};
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
  .button3 {
    background: #252525;
    margin-top: 0.6em;
  }
  .button3:hover {
    background: ${({ theme }) => theme.colors.danger};
  }
`;

export default LoginForm;
