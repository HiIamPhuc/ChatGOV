import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

type Lang = "en" | "vi";
type Dict = Record<string, string>;

const DICTS: Record<Lang, Dict> = {
  en: {
    appTitle: "AI WRAPPER",
    // Auth & shared
    signin: "Sign In",
    signup: "Sign Up",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    fullName: "Full name",
    login: "Login",
    createAccount: "Create account",
    forgot: "Forgot password",
    haveAccount: "Already have an account?",
    needAccount: "Don’t have an account?",
    sending: "Sending...",
    loggingIn: "Logging in...",
    creating: "Creating...",
    logout: "Logout",
    // Chat & sidebar
    history: "History",
    heroTitle: "What are you working on?",
    you_asked: "You asked:",
    noSessions: "No sessions yet",
    settings: "Settings",
    language: "Language",
    signedOut: "Signed out.",
    send: "Send",
    // App
    addLink: "Add website link",
    enterPrompt: "Type your request...",
    linkPlaceholder: "Paste website link (e.g. https://dichvucong.gov.vn)",
    urlInPromptWarn:
      "You pasted a URL into the Prompt. Please put it into + link box instead.",
    // Reset
    resetTitle: "Reset password",
    resetBtn: "Send reset link",
    resetSent: "Password reset email sent (if the email exists).",
    // Toast / statuses
    signupVerify: "Sign-up success. Verification email sent.",
    signinSuccess: "Sign-in success.",
    error: "Error",
  },
  vi: {
    appTitle: "AI WRAPPER",
    // Auth & shared
    signin: "Đăng nhập",
    signup: "Đăng ký",
    email: "Email",
    password: "Mật khẩu",
    confirmPassword: "Xác nhận mật khẩu",
    fullName: "Họ và tên",
    login: "Đăng nhập",
    createAccount: "Tạo tài khoản",
    forgot: "Quên mật khẩu",
    haveAccount: "Đã có tài khoản?",
    needAccount: "Chưa có tài khoản?",
    sending: "Đang gửi...",
    loggingIn: "Đang đăng nhập...",
    creating: "Đang tạo...",
    logout: "Đăng xuất",
    // Chat & sidebar
    history: "Lịch sử",
    heroTitle: "Bạn đang muốn làm gì?",
    you_asked: "Bạn vừa hỏi:",
    noSessions: "Chưa có phiên nào",
    settings: "Cài đặt",
    language: "Ngôn ngữ",
    signedOut: "Đã đăng xuất.",
    send: "Gửi",
    // App
    addLink: "Thêm link website",
    enterPrompt: "Nhập yêu cầu...",
    linkPlaceholder: "Dán link website (vd: https://dichvucong.gov.vn)",
    urlInPromptWarn: "Bạn dán URL trong Prompt. Hãy nhập link vào ô dấu +.",
    // Reset
    resetTitle: "Quên mật khẩu",
    resetBtn: "Gửi link đặt lại",
    resetSent: "Đã gửi email đặt lại mật khẩu (nếu email tồn tại).",
    // Toast / statuses
    signupVerify: "Đăng ký thành công. Đã gửi email xác nhận.",
    signinSuccess: "Đăng nhập thành công.",
    error: "Lỗi",
  },
};

type I18nCtx = { lang: Lang; t: (k: string) => string; setLang: (l: Lang) => void; };
const Ctx = createContext<I18nCtx>({ lang: "en", t: (k) => k, setLang: () => {} });

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang") as Lang | null;
      if (saved === "en" || saved === "vi") setLang(saved);
    } catch {}
  }, []);

  const t = (k: string) => DICTS[lang][k] ?? k;

  const value = useMemo(
    () => ({
      lang,
      t,
      setLang: (l: Lang) => {
        setLang(l);
        try { localStorage.setItem("lang", l); } catch {}
      },
    }),
    [lang]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useI18n = () => useContext(Ctx);
