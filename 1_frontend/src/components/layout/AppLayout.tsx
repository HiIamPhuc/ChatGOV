import { useEffect, useState } from "react";
import styled from "styled-components";
import Sidebar from "@/components/layout/Sidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "@/app/i18n";
import { getProfile } from "@/services/profile";

type ProfileLite = {
  name?: string | null;
  age?: number | null;
  city?: string | null;
};

export default function AppLayout() {
  const { t, lang } = useI18n();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [needProfile, setNeedProfile] = useState(false);

  /* ====== Sidebar state ====== */
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("sbCollapsed") === "1");
    } catch {}
  }, []);
  const toggle = () =>
    setCollapsed((v) => {
      const n = !v;
      try {
        localStorage.setItem("sbCollapsed", n ? "1" : "0");
      } catch {}
      return n;
    });

  /* ====== Banner: nghe từ API (poll + refetch khi focus/route đổi) ====== */
  useEffect(() => {
    let alive = true;
    let timer: number | null = null;

    const computeNeed = (p: ProfileLite | null) => {
      const nameOk = !!p?.name?.toString().trim();
      const ageOk =
        p?.age != null &&
        Number.isInteger(p.age as number) &&
        (p!.age as number) >= 14 &&
        (p!.age as number) <= 100;
      const cityOk = !!p?.city?.toString().trim();
      return !(nameOk && ageOk && cityOk);
    };

    const fetchProfile = async () => {
      try {
        const p = (await getProfile()) as ProfileLite;
        if (alive) setNeedProfile(computeNeed(p));
      } catch (e: any) {
        const status = e?.response?.status;
        if (alive && (status === 404 || status === 204 || status === 401)) {
          setNeedProfile(true);
        }
        // các lỗi khác: giữ nguyên trạng thái, tránh nhấp nháy UI
      }
    };

    // chạy ngay khi mount/đổi route
    fetchProfile();

    // poll nhẹ
    const startPoll = () => {
      stopPoll();
      timer = window.setInterval(fetchProfile, 15000);
    };
    const stopPoll = () => {
      if (timer != null) {
        clearInterval(timer);
        timer = null;
      }
    };

    // refetch khi tab quay lại
    const onFocus = () => fetchProfile();
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchProfile();
    };

    // lắng nghe sự kiện "profile-updated" từ trang Profile nếu có thay đổi
    const onProfileUpdated = () => fetchProfile();

    startPoll();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(
      "profile-updated",
      onProfileUpdated as EventListener
    );

    return () => {
      alive = false;
      stopPoll();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(
        "profile-updated",
        onProfileUpdated as EventListener
      );
    };
  }, [pathname]);

  /* ====== Kebab action ====== */
  const goProfile = () => navigate("/profile");

  const bannerTitle =
    lang === "vi" ? "Hoàn tất hồ sơ của bạn" : "Complete your profile";
  const bannerText =
    lang === "vi"
      ? "Vui lòng điền Họ tên, Tuổi và Nơi sống để ChatGOV có thể cá nhân hoá câu trả lời."
      : "Please fill your Full name, Age and City/District so ChatGOV can personalize answers.";
  const bannerBtn = lang === "vi" ? "Đi tới Hồ sơ" : "Go to Profile";

  return (
    <Shell
      data-collapsed={collapsed ? "true" : "false"}
      data-banner={needProfile ? "1" : "0"}
    >
      <aside className="rail">
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </aside>

      <section className="main">
        {/* Header: FULL overlay trong suốt; SMALL sticky + blur */}
        <Topbar>
          <div className="chrome">
            <div className="title">{t("appTitle")}</div>
          </div>
        </Topbar>

        {/* Banner nhắc hoàn tất hồ sơ */}
        {needProfile && (
          <Banner role="status" aria-live="polite">
            <div className="msg">
              <div className="icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 2 1 21h22L12 2z"
                    fill="currentColor"
                    opacity=".12"
                  />
                  <path
                    d="M12 8a1 1 0 1 0-1-1 1 1 0 0 0 1 1Zm-1 3h2v7h-2z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="text">
                <div className="title">{bannerTitle}</div>
                <div className="desc">{bannerText}</div>
              </div>
            </div>
            <button className="go" onClick={goProfile}>
              {bannerBtn}
            </button>
          </Banner>
        )}

        <div className="content">
          <Outlet />
        </div>
      </section>
    </Shell>
  );
}

/* =============== styles =============== */
const Shell = styled.div`
  --rail: 280px;
  --rail-collapsed: 68px;
  --topbar-h: 60px;
  --banner-h: 56px;

  height: 100vh;
  display: grid;
  grid-template-columns: var(--rail) 1fr;
  overflow: hidden;

  &[data-collapsed="true"] {
    grid-template-columns: var(--rail-collapsed) 1fr;
  }

  .rail {
    height: 100%;
    overflow: hidden;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surface};
  }

  .main {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .content {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: ${({ theme }) => theme.colors.bg};
    padding-top: 0;
  }

  /* Desktop: header absolute => phải chừa cả header + banner khi có banner */
  &[data-banner="1"] .content {
    padding-top: calc(var(--topbar-h) + var(--banner-h));
  }

  /* Mobile: header sticky tự chiếm chỗ => chỉ cộng banner */
  @media (max-width: 980px) {
    .content {
      padding-top: 0;
    }
    &[data-banner="1"] .content {
      padding-top: var(--banner-h);
    }
  }
`;

/* Header: FULL overlay trong suốt + không chặn click; SMALL sticky + nền mờ */
const Topbar = styled.header`
  position: absolute;
  inset: 0 0 auto 0;
  height: var(--topbar-h);
  z-index: 5;
  pointer-events: none;

  .chrome {
    height: var(--topbar-h);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0 16px;
    background: transparent;
    border-bottom: 0;
    backdrop-filter: none;
    color: ${({ theme }) => theme.colors.accent2};
    font-weight: 800;
    pointer-events: none;
  }

  .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 60vw;
    pointer-events: none;
  }

  .actions {
    position: relative;
    pointer-events: auto;
  }
  .kebab {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 999px;
    background: #fff;
    color: ${({ theme }) => theme.colors.accent2};
    cursor: pointer;
    transition: 0.2s;
  }
  .kebab:hover {
    background: #fff5ef;
    border-color: #f0d2c5;
    box-shadow: 0 0 0 2px rgba(206, 122, 88, 0.18) inset;
  }

  .menu {
    position: absolute;
    right: 0;
    top: 44px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: #fff;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12);
    padding: 8px;
    min-width: 180px;
    z-index: 10;
  }
  .menu .item {
    height: 36px;
    padding: 0 10px;
    border: none;
    background: none;
    text-align: left;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.primary};
    transition: transform 0.15s, background-color 0.15s, color 0.15s;
  }
  .menu .item:hover {
    background: #fff5ef;
    transform: translateX(2px);
    color: ${({ theme }) => theme.colors.accent};
  }
  .menu .item .icon {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.secondary};
  }
  .menu .danger {
    color: ${({ theme }) => theme.colors.danger};
  }
  .menu .danger .icon {
    color: ${({ theme }) => theme.colors.danger};
  }

  @media (max-width: 980px) {
    position: sticky;
    top: 0;
    pointer-events: auto;
    .chrome {
      pointer-events: auto;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: saturate(150%) blur(10px);
      border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    }
  }
`;

/* Banner “Hoàn tất hồ sơ” */
const Banner = styled.div`
  --r: 14px;
  position: absolute;
  top: var(--topbar-h); /* ngay dưới header overlay khi full */
  left: 0;
  right: 0;
  height: var(--banner-h);
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 10px 14px;

  background: linear-gradient(
    90deg,
    rgba(206, 122, 88, 0.95),
    rgba(143, 56, 42, 0.95)
  );
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);

  .msg {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }
  .icon {
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    opacity: 0.9;
  }
  .icon svg {
    width: 22px;
    height: 22px;
    fill: currentColor;
  }
  .text {
    min-width: 0;
  }
  .title {
    font-weight: 800;
    line-height: 1.1;
  }
  .desc {
    opacity: 0.96;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .go {
    height: 36px;
    padding: 0 14px;
    border-radius: var(--r);
    border: none;
    cursor: pointer;
    font-weight: 800;
    color: #fff;
    background: rgba(255, 255, 255, 0.18);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15) inset;
    transition: filter 0.15s, transform 0.06s;
  }
  .go:hover {
    filter: brightness(1.05);
  }
  .go:active {
    transform: translateY(1px);
  }

  /* SMALL: sticky ngay dưới header — không thêm padding cho content */
  @media (max-width: 980px) {
    position: sticky;
    top: var(--topbar-h);
  }
`;
