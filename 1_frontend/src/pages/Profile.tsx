import styled from "styled-components";
import { useState } from "react";
import { useI18n } from "@/app/i18n";

type ProfileForm = {
  name: string;
  citizenId: string; // CCCD
  age: string;
  city: string;
  region: string;
  email: string;
  phone: string;
  dob: string;
};

export default function Profile() {
  const { t } = useI18n();

  // Demo dữ liệu ban đầu (tuỳ bạn hydrate từ backend sau)
  const initial: ProfileForm = {
    name: "",
    citizenId: "",
    age: "",
    city: "",
    region: "",
    email: "",
    phone: "",
    dob: "",
  };

  const [form, setForm] = useState<ProfileForm>(initial);
  const [backup, setBackup] = useState<ProfileForm>(initial);
  const [editing, setEditing] = useState(false);

  const onChange = (k: keyof ProfileForm, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const startEdit = () => {
    setBackup(form);
    setEditing(true);
  };

  const cancelEdit = () => {
    setForm(backup);
    setEditing(false);
  };

  const save = () => {
    // TODO: gọi API lưu (nếu cần)
    setEditing(false);
  };


  return (
    <Wrap>
      <div className="card">
        <div className="cardHead">
          <div className="title">
            <h1>{t("profile")}</h1>
            <p className="subtitle">{t("personalInfo")}</p>
          </div>

          <div className="actions">
            {!editing ? (
              <button className="btn accent" onClick={startEdit}>
                {t("edit")}
              </button>
            ) : (
              <>
                <button className="btn ghost" onClick={cancelEdit}>
                  {t("cancel")}
                </button>
                <button className="btn accent" onClick={save}>
                  {t("save")}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid">
          <label>
            {t("fullName")}
            <input
              disabled={!editing}
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </label>

          <label>
            {t("age")}
            <input
              disabled={!editing}
              inputMode="numeric"
              value={form.age}
              onChange={(e) => onChange("age", e.target.value)}
              placeholder="22"
            />
          </label>

          <label>
            {t("city")}
            <input
              disabled={!editing}
              value={form.city}
              onChange={(e) => onChange("city", e.target.value)}
              placeholder="Quận 1, TP.HCM"
            />
          </label>


          <label>
            {t("email")}
            <input
              disabled={!editing}
              type="email"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            {t("phone")}
            <input
              disabled={!editing}
              inputMode="tel"
              value={form.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="09xxxxxxxx"
            />
          </label>

          <label>
            {t("dob")}
            <input
              disabled={!editing}
              type="date"
              value={form.dob}
              onChange={(e) => onChange("dob", e.target.value)}
            />
          </label>
        </div>
      </div>
    </Wrap>
  );
}

/* ===================== styles ===================== */
const Wrap = styled.div`
  padding: 20px;
  max-width: 920px;
  margin: 0 auto;

  .card {
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    padding: 16px;
    box-shadow: ${({ theme }) => theme.shadow};
  }

  .cardHead {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: space-between;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    padding-bottom: 12px;
    margin-bottom: 14px;
  }

  h1 {
    margin: 0;
    font-size: 1.25rem;
    color: ${({ theme }) => theme.colors.primary};
  }

  .subtitle {
    margin: 4px 0 0;
    color: ${({ theme }) => theme.colors.secondary};
    font-size: 0.95rem;
  }

  .actions {
    display: inline-flex;
    gap: 10px;
  }

  .btn {
    height: 36px;
    padding: 0 14px;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: #fff;
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 700;
    cursor: pointer;
    transition: 0.2s;
  }
  .btn:hover {
    background: #fff5ef;
    border-color: #f0d2c5;
  }
  .btn.accent {
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.colors.accent},
      ${({ theme }) => theme.colors.accent2}
    );
    color: #fff;
    border-color: transparent;
    box-shadow: 0 6px 16px rgba(206, 122, 88, 0.35);
  }
  .btn.accent:hover {
    filter: brightness(0.96);
  }
  .btn.ghost {
    background: #fff;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.secondary};
  }

  input {
    height: 38px;
    padding: 0 10px;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    outline: none;
    background: #fff;
    color: ${({ theme }) => theme.colors.primary};
    transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  }
  input:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px rgba(206, 122, 88, 0.2);
  }
  input:disabled {
    background: ${({ theme }) => theme.colors.surface2};
    color: ${({ theme }) => theme.colors.secondary};
    cursor: not-allowed;
  }
`;
