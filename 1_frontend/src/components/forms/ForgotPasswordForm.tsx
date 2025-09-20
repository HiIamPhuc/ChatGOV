import React, { useState } from "react";
import styled from "styled-components";
import { useI18n } from "@/app/i18n";

type Props = {
  onSubmit: (email: string) => void;
  loading?: boolean;
};

const ForgotForm: React.FC<Props> = ({ onSubmit, loading }) => {
  const { t } = useI18n();
  const [email, setEmail] = useState("");

  return (
    <StyledWrapper>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(email.trim());
        }}
      >
        <p id="heading">{t("resetTitle")}</p>

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

        <div className="btn">
          <button disabled={!!loading} className="button1" type="submit">
            {t("resetBtn")}
          </button>
        </div>
      </form>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .form{
    display:flex; flex-direction:column; gap:10px;
    padding: 2em; background:#171717;
    border-radius:24px; border:1px solid #2c2c2c; box-shadow:0 10px 30px rgba(0,0,0,.35);
    width:min(92vw, 460px);
  }
  #heading{ text-align:center; margin:.5em 0 1em; color:#fff; font-size:1.25em; }
  .field{
    display:flex; align-items:center; gap:.6em;
    border-radius:16px; padding:.8em .9em; background:#1f1f1f;
    box-shadow: inset 2px 5px 10px rgba(0,0,0,.35);
  }
  .input-icon{ width:1.3em; height:1.3em; fill:#fff; }
  .input-field{
    flex:1; background:none; border:none; outline:none; color:#d3d3d3; font-size:.95rem;
  }
  .btn{ display:flex; justify-content:center; margin-top:1.2em; }
  .button1{ padding:.7em 1.6em; border-radius:12px; border:1px solid #2c2c2c; background:#252525; color:#fff; transition:.25s; }
  .button1:hover{ background:#000; }
  .button1:disabled{ opacity:.6; cursor:not-allowed; }
`;

export default ForgotForm;
