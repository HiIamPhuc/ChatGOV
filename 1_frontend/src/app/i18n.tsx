import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

type Lang = "en" | "vi";
type Dict = Record<string, string>;

const DICTS: Record<Lang, Dict> = {
  en: {
    appTitle: "ChatGOV",

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
    heroTitle: "What online public service registration do you need help with?",
    you_asked: "You asked:",
    noSessions: "No sessions yet",
    settings: "Settings",
    language: "Language",
    signedOut: "Signed out.",
    send: "Send",
    newChat: "New chat",
    searchChats: "Search chats",
    chats: "Chats",
    more: "More",
    rename: "Rename",
    delete: "Delete",

    // App
    addLink: "Add website link",
    enterPrompt: "Type your request...",
    linkPlaceholder: "Paste website link (e.g. https://dichvucong.gov.vn)",
    urlInPromptWarn:
      "You pasted a URL into the Prompt. Please put it into + link box instead.",

    // Reset (request email)
    resetTitle: "Reset password",
    resetBtn: "Send reset link",
    resetSent: "Password reset email sent (if the email exists).",

    // Reset flow (set new password page)
    setNewPassword: "Set a new password",
    newPassword: "New password",
    updatePassword: "Update password",
    passwordUpdated: "Password updated successfully.",
    passwordTooShort: "Password must be at least 8 characters.",

    // Profile
    profile: "Profile",
    personalInfo: "Your personal information",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    age: "Age",
    city: "City / District",
    phone: "Phone",
    dob: "Date of birth",
    changePassword: "Change password",
    changePasswordSubtitle: "Update your password for this account",
    currentPassword: "Current password",
    confirmNewPassword: "Confirm new password",
    updating: "Updating...",
    passwordNotMatch: "New password confirmation does not match.",
    passwordUpdateFailed: "Failed to update password.",

    // Used by Profile validations / toasts
    requireName: "Please enter your full name.",
    requireAge: "Please enter your age.",
    requireCity: "Please enter your city/district.",
    ageInteger: "Age must be an integer.",
    ageRange: `Age must be between ${14}–${100}.`,
    dobInvalid: "Invalid date of birth.",
    dobFuture: "Date of birth cannot be in the future.",
    ageDobMismatch: "Age does not match date of birth.",
    noChanges: "No changes to save.",
    saved: "Saved.",

    // DateField
    invalidDateLead: "Please enter a valid date in",
    pickDate: "Pick a date",

    // Password helpers
    fillAllPw: "Please fill in all password fields.",
    newPwSameAsCurrent: "New password must be different from the current password.",

    // Toast / statuses
    signupVerify: "Sign-up success. Verification email sent.",
    signinSuccess: "Sign-in success.",
    error: "Error",

    // Disclaimer
    chatDisclaimer: "ChatGOV can make mistakes. Check important info.",
  },

  vi: {
    appTitle: "ChatGOV",

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
    heroTitle: "Bạn đang cần hỗ trợ đăng kí online dịch vụ công nào?",
    you_asked: "Bạn vừa hỏi:",
    noSessions: "Chưa có phiên nào",
    settings: "Cài đặt",
    language: "Ngôn ngữ",
    signedOut: "Đã đăng xuất.",
    send: "Gửi",
    newChat: "Đoạn chat mới",
    searchChats: "Tìm kiếm đoạn chat",
    chats: "Các phiên Chat",
    more: "Thêm tuỳ chọn",
    rename: "Đổi tên",
    delete: "Xoá",

    // App
    addLink: "Thêm link website",
    enterPrompt: "Nhập yêu cầu của bạn...",
    linkPlaceholder: "Dán link website (vd: https://dichvucong.gov.vn)",
    urlInPromptWarn: "Bạn dán URL trong Prompt. Hãy nhập link vào ô dấu +.",

    // Reset (request email)
    resetTitle: "Quên mật khẩu",
    resetBtn: "Gửi link đặt lại",
    resetSent: "Đã gửi email đặt lại mật khẩu (nếu email tồn tại).",

    // Reset flow (set new password page)
    setNewPassword: "Đặt mật khẩu mới",
    newPassword: "Mật khẩu mới",
    updatePassword: "Cập nhật mật khẩu",
    passwordUpdated: "Đổi mật khẩu thành công.",
    passwordTooShort: "Mật khẩu phải có tối thiểu 8 ký tự.",

    // Profile
    profile: "Hồ sơ",
    personalInfo: "Thông tin cá nhân của bạn",
    edit: "Chỉnh sửa",
    save: "Lưu",
    cancel: "Huỷ",
    age: "Tuổi",
    city: "Nơi sống (Quận/Huyện)",
    phone: "Số điện thoại",
    dob: "Ngày sinh",
    changePassword: "Đổi mật khẩu",
    changePasswordSubtitle: "Cập nhật mật khẩu cho tài khoản của bạn",
    currentPassword: "Mật khẩu hiện tại",
    confirmNewPassword: "Xác nhận mật khẩu mới",
    updating: "Đang cập nhật...",
    passwordNotMatch: "Xác nhận mật khẩu mới không khớp.",
    passwordUpdateFailed: "Cập nhật mật khẩu không thành công.",

    // Used by Profile validations / toasts
    requireName: "Vui lòng nhập Họ và tên.",
    requireAge: "Vui lòng nhập Tuổi.",
    requireCity: "Vui lòng nhập Nơi sống (Quận/Huyện).",
    ageInteger: "Tuổi phải là số nguyên.",
    ageRange: `Độ tuổi phải từ ${14}–${100}.`,
    dobInvalid: "Ngày sinh không hợp lệ.",
    dobFuture: "Ngày sinh không được lớn hơn hiện tại.",
    ageDobMismatch: "Tuổi không khớp với ngày sinh.",
    noChanges: "Không có thay đổi nào.",
    saved: "Đã lưu.",

    // DateField
    invalidDateLead: "Vui lòng nhập ngày theo định dạng",
    pickDate: "Chọn ngày",

    // Password helpers
    fillAllPw: "Vui lòng điền đầy đủ các ô mật khẩu.",
    newPwSameAsCurrent: "Mật khẩu mới phải khác mật khẩu hiện tại.",

    // Toast / statuses
    signupVerify: "Đăng ký thành công. Đã gửi email xác nhận.",
    signinSuccess: "Đăng nhập thành công.",
    error: "Lỗi",

    // Disclaimer
    chatDisclaimer: "ChatGOV có thể sai sót. Hãy kiểm tra thông tin quan trọng.",
  },
};

type I18nCtx = { lang: Lang; t: (k: string) => string; setLang: (l: Lang) => void; };
const Ctx = createContext<I18nCtx>({ lang: "vi", t: (k) => k, setLang: () => {} });

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>("vi");

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
