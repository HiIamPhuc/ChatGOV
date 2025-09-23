import styled from "styled-components";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/app/i18n";
import PwField from "@/components/common/inputs/PwField";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

type ProfileForm = {
  name: string;
  age: string;
  city: string;
  region: string;
  email: string;
  phone: string;
  dob: string;
};

type PwForm = { current: string; next: string; confirm: string };

/* ========= Date utils ========= */
const ISO_FMT = "YYYY-MM-DD";
const DISP_FMT = "DD/MM/YYYY";

function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const d = dayjs(iso, ISO_FMT, true);
  return d.isValid() ? d.format(DISP_FMT) : "";
}

function displayToIso(display: string): { iso: string; valid: boolean } {
  const d = dayjs(display, DISP_FMT, true);
  if (!d.isValid()) return { iso: "", valid: false };
  return { iso: d.format(ISO_FMT), valid: true };
}

/** Ô nhập date tuỳ biến: hiển thị DD/MM/YYYY, nút mở native date picker */
function DateField({
  label,
  valueISO,
  disabled,
  onCommitISO,
  placeholder = DISP_FMT,
}: {
  label: string;
  valueISO: string; // ISO
  disabled?: boolean;
  onCommitISO: (nextISO: string) => void;
  placeholder?: string;
}) {
  const [display, setDisplay] = useState<string>(isoToDisplay(valueISO));
  const [invalid, setInvalid] = useState(false);
  const nativeRef = useRef<HTMLInputElement>(null);

  // Sync khi valueISO từ ngoài thay đổi (ví dụ Cancel chỉnh sửa)
  useEffect(() => {
    setDisplay(isoToDisplay(valueISO));
    setInvalid(false);
  }, [valueISO]);

  const onChangeText = (v: string) => {
    // chỉ cho phép số và '/'
    const cleaned = v.replace(/[^\d/]/g, "");
    setDisplay(cleaned);
    // validate nhanh khi đủ 8 kí tự (ddMMyyyy) hoặc 10 kí tự (dd/MM/yyyy)
    if (cleaned.length >= 8) {
      const { valid } = displayToIso(cleaned);
      setInvalid(!valid);
    } else {
      setInvalid(false);
    }
  };

  const onBlurText = () => {
    if (!display) {
      onCommitISO("");
      setInvalid(false);
      return;
    }
    const parsed = displayToIso(display);
    if (parsed.valid) {
      onCommitISO(parsed.iso);
      setDisplay(isoToDisplay(parsed.iso)); // chuẩn hoá lại format
      setInvalid(false);
    } else {
      setInvalid(true);
    }
  };

  const openNativePicker = () => {
    if (disabled) return;
    const el = nativeRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") el.showPicker();
      else {
        el.focus();
        el.click();
      }
    } catch {
      el.focus();
      el.click();
    }
  };

  const onNativeChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const iso = e.target.value; // YYYY-MM-DD
    onCommitISO(iso);
    setDisplay(isoToDisplay(iso));
    setInvalid(false);
  };

  return (
    <label>
      {label}
      <div className="dateField">
        {/* text hiển thị DD/MM/YYYY */}
        <input
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          disabled={disabled}
          value={display}
          onChange={(e) => onChangeText(e.target.value)}
          onBlur={onBlurText}
          aria-invalid={invalid ? "true" : "false"}
        />
        {/* input date native ẩn (để mở popup lịch) */}
        <input
          ref={nativeRef}
          className="native"
          type="date"
          value={valueISO || ""}
          onChange={onNativeChange}
          // disabled đồng bộ
          disabled={disabled}
        />
        <button
          type="button"
          className="calendarBtn"
          onClick={openNativePicker}
          aria-label="Chọn ngày trên lịch"
          title="Chọn ngày trên lịch"
          disabled={disabled}
        >
          {calendarSvg}
        </button>
      </div>
      {invalid && (
        <div className="msg error small">
          Ngày không hợp lệ. Vui lòng nhập theo định dạng {DISP_FMT} (ví dụ:
          09/02/2001)
        </div>
      )}
    </label>
  );
}

const calendarSvg = (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <rect
      x="3"
      y="4"
      width="18"
      height="17"
      rx="2"
      ry="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
    <line
      x1="3"
      y1="10"
      x2="21"
      y2="10"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

/* ========= Trang Profile ========= */
export default function Profile() {
  const { t } = useI18n();

  const initial: ProfileForm = {
    name: "",
    age: "",
    city: "",
    region: "",
    email: "",
    phone: "",
    dob: "", // ISO hoặc "" nếu chưa có
  };

  const [form, setForm] = useState<ProfileForm>(initial);
  const [backup, setBackup] = useState<ProfileForm>(initial);
  const [editing, setEditing] = useState(false);

  const [pw, setPw] = useState<PwForm>({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

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

  const save = async () => {
    // TODO: gọi API lưu profile (form.dob là ISO "YYYY-MM-DD")
    setEditing(false);
  };

  const onChangePw = async () => {
    setPwError(null);
    setPwSuccess(null);
    if (pw.next.length < 8) {
      setPwError(t("passwordTooShort"));
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwError(t("passwordNotMatch"));
      return;
    }

    setPwLoading(true);
    try {
      // TODO: gọi API đổi mật khẩu
      setPwSuccess(t("passwordUpdated"));
      setPw({ current: "", next: "", confirm: "" });
    } catch (e) {
      setPwError(t("passwordUpdateFailed"));
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <Wrap>
      {/* ======= Card: Thông tin cá nhân ======= */}
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

          {/* DOB: DD/MM/YYYY + picker */}
          <DateField
            label={t("dob")}
            valueISO={form.dob}
            disabled={!editing}
            onCommitISO={(iso) => onChange("dob", iso)}
          />
        </div>
      </div>

      {/* ======= Card: Đổi mật khẩu ======= */}
      <div className="card">
        <div className="cardHead">
          <div className="title">
            <h2>{t("changePassword")}</h2>
            <p className="subtitle">{t("changePasswordSubtitle")}</p>
          </div>
        </div>

        <div className="grid pwGrid">
          <PwField
            label={t("currentPassword")}
            value={pw.current}
            onChange={(v) => setPw((p) => ({ ...p, current: v }))}
            autoComplete="current-password"
          />
          <PwField
            label={t("newPassword")}
            value={pw.next}
            onChange={(v) => setPw((p) => ({ ...p, next: v }))}
            autoComplete="new-password"
          />
          <PwField
            label={t("confirmNewPassword")}
            value={pw.confirm}
            onChange={(v) => setPw((p) => ({ ...p, confirm: v }))}
            autoComplete="new-password"
          />
        </div>

        <div className="pwActions">
          {pwError && <div className="msg error">{pwError}</div>}
          {pwSuccess && <div className="msg success">{pwSuccess}</div>}

          <button
            className="btn accent"
            onClick={onChangePw}
            disabled={pwLoading}
          >
            {pwLoading ? t("updating") : t("updatePassword")}
          </button>
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
    + .card {
      margin-top: 16px;
    }
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

  h1,
  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: ${({ theme }) => theme.colors.accent2};
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
  .pwGrid {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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
    transition: border-color 0.15s ease, box-shadow 0.15s ease,
      background 0.15s ease;
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

  /* DateField style */
  .dateField {
    position: relative;
    display: flex;
    align-items: center;
  }
  .dateField input[aria-invalid="true"] {
    border-color: #d63636;
    box-shadow: 0 0 0 3px rgba(214, 54, 54, 0.18);
  }
  /* native input ẩn nhưng vẫn tồn tại để mở picker */
  .dateField .native {
    position: absolute;
    inset: 0;
    opacity: 0; /* ẩn hoàn toàn */
    pointer-events: none; /* không cản click, chỉ mở qua nút */
  }
  .dateField .calendarBtn {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: ${({ theme }) => theme.colors.secondary};
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .dateField .calendarBtn:hover {
    color: ${({ theme }) => theme.colors.accent};
    background: #fff5ef;
  }

  .pwActions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    justify-content: flex-end;
  }

  .msg {
    padding: 6px 10px;
    border-radius: 8px;
    font-weight: 600;
  }
  .msg.small {
    font-size: 0.9rem;
    padding: 5px 8px;
  }
  .msg.error {
    background: #ffe6e6;
    color: #c93434;
  }
  .msg.success {
    background: #e6fff4;
    color: #0f8a5f;
  }
`;
