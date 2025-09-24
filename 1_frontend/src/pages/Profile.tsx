import styled from "styled-components";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/app/i18n";
import PwField from "@/components/common/inputs/PwField";
import { getProfile, updateProfile, changePassword } from "@/services/profile";
import { logout } from "@/services/auth";
import { useToast } from "@/app/toast";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

type ProfileForm = { name: string; age: string; city: string; email: string; phone: string; dob: string; };
type PwForm = { current: string; next: string; confirm: string };

const ISO_FMT = "YYYY-MM-DD";
const DISP_FMT = "DD/MM/YYYY";
const MIN_AGE = 14;
const MAX_AGE = 100;

/* ===== Date helpers ===== */
function isoToDisplay(iso: string){ if(!iso) return ""; const d=dayjs(iso,ISO_FMT,true); return d.isValid()?d.format(DISP_FMT):""; }
function displayToIso(display: string){ const d=dayjs(display,DISP_FMT,true); return d.isValid()?{iso:d.format(ISO_FMT),valid:true}:{iso:"",valid:false}; }

/* ===== DateField ===== */
function DateField({
  label, valueISO, disabled, onCommitISO, placeholder = DISP_FMT, invalidText, pickLabel,
}:{
  label:string; valueISO:string; disabled?:boolean; onCommitISO:(nextISO:string)=>void; placeholder?:string; invalidText:string; pickLabel:string;
}){
  const [display,setDisplay]=useState<string>(isoToDisplay(valueISO));
  const [invalid,setInvalid]=useState(false);
  const nativeRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{ setDisplay(isoToDisplay(valueISO)); setInvalid(false); },[valueISO]);

  const onChangeText=(v:string)=>{ const cleaned=v.replace(/[^\d/]/g,""); setDisplay(cleaned); setInvalid(cleaned.length>=8 ? !displayToIso(cleaned).valid : false); };
  const onBlurText=()=>{ if(!display){ onCommitISO(""); setInvalid(false); return; } const parsed=displayToIso(display); if(parsed.valid){ onCommitISO(parsed.iso); setDisplay(isoToDisplay(parsed.iso)); setInvalid(false);} else setInvalid(true); };
  const openNativePicker=()=>{ if(disabled) return; const el=nativeRef.current; if(!el) return; try{ // @ts-ignore
    if(typeof el.showPicker==="function") el.showPicker(); else { el.focus(); el.click(); } } catch { el.focus(); el.click(); } };
  const onNativeChange:React.ChangeEventHandler<HTMLInputElement>=(e)=>{ const iso=e.target.value; onCommitISO(iso); setDisplay(isoToDisplay(iso)); setInvalid(false); };

  return (
    <label>
      <div className="lbl">{label}</div>
      <div className="dateField">
        <input type="text" inputMode="numeric" placeholder={placeholder} disabled={disabled} value={display}
               onChange={(e)=>onChangeText(e.target.value)} onBlur={onBlurText} aria-invalid={invalid?"true":"false"} />
        <input ref={nativeRef} className="native" type="date" value={valueISO||""} onChange={onNativeChange} disabled={disabled}/>
        <button type="button" className="calendarBtn" onClick={openNativePicker} aria-label={pickLabel} title={pickLabel} disabled={disabled}>{calendarSvg}</button>
      </div>
      {invalid && <div className="msg error small">{invalidText} {DISP_FMT} (09/02/2001)</div>}
    </label>
  );
}
const calendarSvg=(<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
  <rect x="3" y="4" width="18" height="17" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2"/>
  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>);

export default function Profile(){
  const { t } = useI18n();
  const { notify } = useToast();
  const nav = useNavigate();

  const initial:ProfileForm={name:"",age:"",city:"",email:"",phone:"",dob:""};
  const [form,setForm]=useState<ProfileForm>(initial);
  const [backup,setBackup]=useState<ProfileForm>(initial);
  const [editing,setEditing]=useState(false);

  const [pw,setPw]=useState<PwForm>({current:"",next:"",confirm:""});
  const [pwLoading,setPwLoading]=useState(false);
  const [pwError,setPwError]=useState<string|null>(null);
  const [pwSuccess,setPwSuccess]=useState<string|null>(null);

  // auto-hide inline messages
  useEffect(()=>{ if(!pwError && !pwSuccess) return; const id=setTimeout(()=>{ setPwError(null); setPwSuccess(null); },4000); return()=>clearTimeout(id); },[pwError,pwSuccess]);

  useEffect(()=>{ (async()=>{ try{
      const p=await getProfile();
      const pf:ProfileForm={ name:p.name||"", age:p.age!=null?String(p.age):"", city:p.city||"", email:p.email||"", phone:p.phone||"", dob:p.dob||"", };
      setForm(pf); setBackup(pf);
    }catch(e:any){ notify({title:t("error"),content:e?.response?.data?.detail||e?.message,tone:"error"}); } })(); },[notify,t]);

  const onChange=(k:keyof ProfileForm,v:string)=>setForm(prev=>({...prev,[k]:v}));
  const startEdit=()=>{ setBackup(form); setEditing(true); };
  const cancelEdit=()=>{ setForm(backup); setEditing(false); };

  const hasDiff=(a:ProfileForm,b:ProfileForm)=> a.name!==b.name||a.age!==b.age||a.city!==b.city||a.phone!==b.phone||a.dob!==b.dob;

  const save=async ()=>{
    // ===== Required fields =====
    if(!form.name.trim()){ notify({title:t("error"),content:t("requireName"),tone:"error"}); return; }
    if(!form.age.trim()){ notify({title:t("error"),content:t("requireAge"),tone:"error"}); return; }
    if(!form.city.trim()){ notify({title:t("error"),content:t("requireCity"),tone:"error"}); return; }

    // ===== FE validations (phone để backend) =====
    const ageNum=form.age?Number(form.age):null;
    if(form.age&&(Number.isNaN(ageNum)||!Number.isInteger(ageNum))){ notify({title:t("error"),content:t("ageInteger"),tone:"error"}); return; }
    if(ageNum!==null&&(ageNum<MIN_AGE||ageNum>MAX_AGE)){ notify({title:t("error"),content:t("ageRange"),tone:"error"}); return; }

    if(form.dob){
      const dob=dayjs(form.dob,ISO_FMT,true);
      if(!dob.isValid()){ notify({title:t("error"),content:t("dobInvalid"),tone:"error"}); return; }
      if(dob.isAfter(dayjs(),"day")){ notify({title:t("error"),content:t("dobFuture"),tone:"error"}); return; }
      const calcAge=dayjs().diff(dob,"year");
      if(calcAge<MIN_AGE||calcAge>MAX_AGE){ notify({title:t("error"),content:t("ageRange"),tone:"error"}); return; }
      if(ageNum!==null&&ageNum!==calcAge){ notify({title:t("error"),content:t("ageDobMismatch"),tone:"error"}); return; }
    }

    if(!hasDiff(form,backup)){ notify({title:t("noChanges"),tone:"info"}); setEditing(false); return; }

    try{
      const patch={ name:form.name||null, age:ageNum??null, city:form.city||null, phone:form.phone||null, dob:form.dob||null };
      const updated=await updateProfile(patch);
      const pf:ProfileForm={ name:updated.name||"", age:updated.age!=null?String(updated.age):"", city:updated.city||"", email:updated.email||"", phone:updated.phone||"", dob:updated.dob||"", };
      setForm(pf); setBackup(pf); setEditing(false);
      notify({title:t("saved"),tone:"success"});
      // báo layout cập nhật banner
      window.dispatchEvent(new Event("profile-updated"));
    }catch(e:any){
      notify({title:t("error"),content:e?.response?.data?.detail||e?.message,tone:"error"});
    }
  };

  const onChangePw=async ()=>{
    setPwError(null); setPwSuccess(null);
    if(!pw.current||!pw.next||!pw.confirm){ setPwError(t("fillAllPw")); return; }
    if(pw.next.length<8){ setPwError(t("passwordTooShort")); return; }
    if(pw.next!==pw.confirm){ setPwError(t("passwordNotMatch")); return; }
    if(pw.current===pw.next){ setPwError(t("newPwSameAsCurrent")); return; }

    setPwLoading(true);
    try{
      await changePassword(pw.current,pw.next);
      setPwSuccess(t("passwordUpdated"));
      setPw({current:"",next:"",confirm:""});
      setTimeout(async()=>{ try{ await logout(); } finally{ nav("/signin",{replace:true}); } },2500);
    }catch(e:any){
      setPwError(e?.response?.data?.detail||e?.message||t("passwordUpdateFailed"));
    }finally{ setPwLoading(false); }
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
              <button className="btn accent" onClick={startEdit}>{t("edit")}</button>
            ) : (
              <>
                <button className="btn ghost" onClick={cancelEdit}>{t("cancel")}</button>
                <button className="btn accent" onClick={save}>{t("save")}</button>
              </>
            )}
          </div>
        </div>

        <div className="grid">
          <label>
            <div className="lbl">
              <span>{t("fullName")}</span>
              <span className="req" aria-hidden="true">*</span>
            </div>
            <input aria-required="true" disabled={!editing} value={form.name}
                   onChange={(e)=>onChange("name",e.target.value)} placeholder="Họ tên của bạn" />
          </label>

          <label>
            <div className="lbl">
              <span>{t("age")}</span>
              <span className="req" aria-hidden="true">*</span>
            </div>
            <input aria-required="true" disabled={!editing} inputMode="numeric" value={form.age}
                   onChange={(e)=>onChange("age",e.target.value.replace(/[^\d]/g,""))} placeholder="Tuổi của bạn" />
          </label>

          <label>
            <div className="lbl">
              <span>{t("city")}</span>
              <span className="req" aria-hidden="true">*</span>
            </div>
            <input aria-required="true" disabled={!editing} value={form.city}
                   onChange={(e)=>onChange("city",e.target.value)} placeholder="Nơi ở của bạn" />
          </label>

          <label>
            <div className="lbl">{t("email")}</div>
            <input disabled type="email" value={form.email} readOnly />
          </label>

          <label>
            <div className="lbl">{t("phone")}</div>
            <input disabled={!editing} inputMode="tel" value={form.phone}
                   onChange={(e)=>onChange("phone",e.target.value.replace(/[^\d+]/g,"").replace(/\s+/g,""))}
                   placeholder="Số điện thoại của bạn" />
          </label>

          <DateField
            label={<div className="lbl">{t("dob")}</div> as unknown as string}
            valueISO={form.dob}
            disabled={!editing}
            onCommitISO={(iso)=>onChange("dob",iso)}
            invalidText={t("invalidDateLead")}
            pickLabel={t("pickDate")}
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
          <PwField label={t("currentPassword")} value={pw.current} onChange={(v)=>setPw(p=>({...p,current:v}))} autoComplete="current-password"/>
          <PwField label={t("newPassword")} value={pw.next} onChange={(v)=>setPw(p=>({...p,next:v}))} autoComplete="new-password"/>
          <PwField label={t("confirmNewPassword")} value={pw.confirm} onChange={(v)=>setPw(p=>({...p,confirm:v}))} autoComplete="new-password"/>
        </div>

        <div className="pwActions">
          {pwError && <div className="msg error">{pwError}</div>}
          {pwSuccess && <div className="msg success">{pwSuccess}</div>}
          <button className="btn accent" onClick={onChangePw} disabled={pwLoading}>
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
    + .card { margin-top: 16px; }
  }

  .cardHead {
    display: flex; align-items: center; gap: 12px; justify-content: space-between;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    padding-bottom: 12px; margin-bottom: 14px;
  }

  h1, h2 { margin: 0; font-size: 1.25rem; color: ${({ theme }) => theme.colors.accent2}; }
  .subtitle { margin: 4px 0 0; color: ${({ theme }) => theme.colors.secondary}; font-size: .95rem; }

  .actions { display: inline-flex; gap: 10px; }

  .btn {
    height: 36px; padding: 0 14px; border-radius: 10px; border: none; background: #fff;
    color: ${({ theme }) => theme.colors.primary}; font-weight: 700; cursor: pointer;
    transition: transform .06s ease, filter .15s ease, box-shadow .15s ease;
  }
  .btn:hover { background: #fff5ef; }
  .btn.accent { background-image: linear-gradient(90deg, ${({ theme }) => theme.colors.accent} 0%, ${({ theme }) => theme.colors.accent2} 100%); color:#fff; box-shadow:0 6px 16px rgba(206,122,88,.35); }
  .btn.accent:hover { filter: brightness(.96); } .btn.accent:active { transform: translateY(1px); filter: brightness(.92); }
  .btn.ghost { background:#fff; border:1px solid ${({ theme }) => theme.colors.border}; } .btn.ghost:hover { background:#fff5ef; border-color:#f0d2c5; }

  .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:12px; }
  .pwGrid { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }

  label { display:flex; flex-direction:column; gap:6px; font-weight:600; color:${({ theme }) => theme.colors.secondary}; }
  .lbl { display:flex; align-items:center; gap:4px; line-height:1; white-space:nowrap; }
  .req { color:#d63636; }

  input {
    height: 38px; padding: 0 10px; border-radius: 10px; border:1px solid ${({ theme }) => theme.colors.border};
    outline:none; background:#fff; color:${({ theme }) => theme.colors.primary};
    transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
  }
  input:focus { border-color:${({ theme }) => theme.colors.accent}; box-shadow:0 0 0 3px rgba(206,122,88,.2); }
  input:disabled { background:${({ theme }) => theme.colors.surface2}; color:${({ theme }) => theme.colors.secondary}; cursor:not-allowed; }

  /* DateField */
  .dateField { position: relative; display:flex; align-items:center; }
  .dateField input[aria-invalid="true"] { border-color:#d63636; box-shadow:0 0 0 3px rgba(214,54,54,.18); }
  .dateField .native { position:absolute; inset:0; opacity:0; pointer-events:none; }
  .dateField .calendarBtn { position:absolute; right:6px; top:50%; transform:translateY(-50%); width:30px; height:30px; border:none; border-radius:8px; background:transparent; color:${({ theme }) => theme.colors.secondary}; display:grid; place-items:center; cursor:pointer; }
  .dateField .calendarBtn:hover { color:${({ theme }) => theme.colors.accent}); background:#fff5ef; }

  .pwActions { display:flex; align-items:center; gap:12px; margin-top:12px; justify-content:flex-end; }
  .msg { padding:6px 10px; border-radius:8px; font-weight:600; }
  .msg.small { font-size:.9rem; padding:5px 8px; }
  .msg.error { background:#ffe6e6; color:#c93434; }
  .msg.success { background:#e6fff4; color:#0f8a5f; }
`;
