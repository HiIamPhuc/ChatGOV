import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styled from "styled-components";
import PromptInput from "@/components/common/chat/PromptInput";
import ChatMessage from "@/components/common/chat/ChatMessage";
import LoaderTyping from "@/components/common/loaders/LoaderTyping";
import { useI18n } from "@/app/i18n";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const SCROLL_DURATION_MS = 900; // chỉnh tốc độ scroll
const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  const [autoFollow, setAutoFollow] = useState(true);
  const [unread, setUnread] = useState(0);

  const animIdRef = useRef<number | null>(null);
  const prevTopRef = useRef<number>(0); // để nhận biết kéo lên

  // theo dõi chiều cao footer để đặt vị trí nút jump & padding-bottom
  const footerRef = useRef<HTMLDivElement | null>(null);
  const [footerH, setFooterH] = useState<number>(120); // fallback ban đầu

  const { t } = useI18n();
  const isEmpty = messages.length === 0;

  const cancelAnim = () => {
    if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    animIdRef.current = null;
  };

  const animateToBottom = (duration = SCROLL_DURATION_MS) => {
    const el = scrollRef.current;
    if (!el) return;

    cancelAnim();
    const startTop = el.scrollTop;
    const startTime = performance.now();

    const step = (now: number) => {
      // mục tiêu luôn cập nhật để theo kịp nội dung đang nở ra
      const target = el.scrollHeight - el.clientHeight;
      const t = Math.min(1, (now - startTime) / duration);
      el.scrollTop = startTop + (target - startTop) * easeInOut(t);

      if (t < 1) {
        animIdRef.current = requestAnimationFrame(step);
      } else {
        animIdRef.current = null;
      }
    };

    // double-rAF để chắc chắn layout xong
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        // cập nhật prevTopRef để onScroll không hiểu nhầm là người dùng kéo lên
        prevTopRef.current = el.scrollTop;
        step(performance.now());
      })
    );

    setUnread(0);
  };

  const scrollToBottom = (instant = false) => {
    const el = scrollRef.current;
    if (!el) return;
    if (instant) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          cancelAnim();
          el.scrollTop = el.scrollHeight;
          prevTopRef.current = el.scrollTop;
        })
      );
    } else {
      animateToBottom();
    }
    setAutoFollow(true);
    setUnread(0);
  };

  useEffect(() => {
    scrollToBottom(true);
  }, []);

  useLayoutEffect(() => {
    if (autoFollow) scrollToBottom(false);
    else if (messages.length) setUnread((n) => n + 1);
  }, [messages, typing]);

  // nội dung nở ra (markdown, ảnh…) bám đuôi
  useEffect(() => {
    if (!innerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (autoFollow) scrollToBottom(false);
    });
    ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [autoFollow]);

  // quan sát chiều cao footer (PromptInput) để cập nhật CSS var
  useEffect(() => {
    if (!footerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const h =
        entries[0]?.contentRect?.height || footerRef.current!.offsetHeight;
      setFooterH(Math.round(h));
    });
    ro.observe(footerRef.current);
    return () => ro.disconnect();
  }, []);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const threshold = 60;
    const deltaToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = deltaToBottom < threshold;

    // phát hiện người dùng kéo lên => huỷ animation, tắt autofollow
    const prevTop = prevTopRef.current;
    const nowTop = el.scrollTop;
    const userScrolledUp = nowTop < prevTop - 1; // -1 để tránh nhiễu
    prevTopRef.current = nowTop;

    if (userScrolledUp) {
      cancelAnim();
      setAutoFollow(false);
    } else if (atBottom) {
      setAutoFollow(true);
      setUnread(0);
    }
  };

  const jumpToBottom = () => {
    scrollToBottom(false);
  };

  const onSend = async (p: { prompt: string; rootUrl?: string }) => {
    setTyping(true);
    // mock response
    const demo: Msg[] = [
      { id: crypto.randomUUID(), role: "user", content: p.prompt },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `**Hướng dẫn nộp hồ sơ trực tuyến** cho dịch vụ: *Cấp lại CCCD*.

<!--steps:["Truy cập Cổng Dịch vụ công quốc gia.","Đăng nhập/đăng ký tài khoản công dân.","Tìm dịch vụ 'Cấp lại Căn cước công dân'.","Điền mẫu đơn, tải lên giấy tờ yêu cầu.","Xác nhận, ký số (nếu có) và nộp hồ sơ.","Theo dõi trạng thái trong mục Hồ sơ của tôi."]-->

👉 Liên kết: https://dichvucong.gov.vn/p/home/dvc-trang-chu.html

- **Phí xử lý:** 50.000đ (tham khảo)
- **Thời gian dự kiến:** 7–10 ngày làm việc

> Lưu ý: Thông tin chỉ mang tính demo. Khi tích hợp backend, nội dung sẽ do LLM trả về.`,
      },
    ];
    setMessages((prev) => prev.concat(demo));
    setTyping(false);
  };

  return (
    // đẩy CSS var --footer-h xuống styled
    <Main style={{ ["--footer-h" as any]: `${footerH}px` }}>
      {isEmpty ? (
        <div className="home">
          <h1 className="hero">
            {t("heroTitle") ?? "Bạn đang cần hỗ trợ gì?"}
          </h1>
          <div className="heroComposer">
            <PromptInput onSend={onSend} maxWidth={720} compact />
          </div>
        </div>
      ) : (
        <>
          <div className="scroll" ref={scrollRef} onScroll={onScroll}>
            <div className="inner" ref={innerRef}>
              {messages.map((m) => (
                <ChatMessage key={m.id} msg={m} />
              ))}
              {typing && (
                <div className="typing">
                  <LoaderTyping />
                </div>
              )}
            </div>
          </div>

          {!autoFollow && (
            <button
              className="jump"
              onClick={jumpToBottom}
              aria-label={t("jumpToLatest") || "Jump to latest"}
              title={t("jumpToLatest") || "Jump to latest"}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  d="M6 9l6 6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {unread > 0 && <span className="badge">{unread}</span>}
            </button>
          )}

          <footer className="input" ref={footerRef}>
            <PromptInput onSend={onSend} maxWidth={820} />
            <p className="disclaimer">
              {t("chatDisclaimer") ||
                "ChatGPT can make mistakes. Check important info."}
            </p>
          </footer>
        </>
      )}
    </Main>
  );
}

const Main = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;

  .home {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    flex: 1;
  }
  .hero {
    font-size: clamp(24px, 2.6vw, 36px);
    margin: 0;
    text-align: center;
    color: ${({ theme }) => theme.colors.accent2};
  }
  .heroComposer {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .scroll {
    flex: 1;
    overflow: auto;
    padding: 18px;
    /* padding-bottom dựa trên chiều cao footer */
    padding-bottom: calc(var(--footer-h, 120px) + 24px);
  }
  .inner {
    max-width: 920px;
    margin: 0 auto;
  }
  .typing {
    padding: 10px 0;
  }

  .input {
    position: sticky;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 0 18px 10px;
    background: transparent;
    border-top: 1px solid transparent;
    z-index: 2;
  }
  .disclaimer {
    margin: 2px 0 6px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.secondary};
    text-align: center;
  }

  .jump {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    /* luôn nằm trên PromptInput */
    bottom: calc(var(--footer-h, 120px) + 12px);
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    display: grid;
    place-items: center;
    color: #fff;
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.colors.accent},
      ${({ theme }) => theme.colors.accent2}
    );
    box-shadow: 0 10px 24px rgba(206, 122, 88, 0.25);
    cursor: pointer;
    transition: filter 0.15s, transform 0.15s;
    z-index: 3;
  }
  .jump:hover {
    filter: brightness(0.96);
  }
  .jump:active {
    transform: translateX(-50%) scale(0.98);
  }
  .jump .badge {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: #fff;
    color: ${({ theme }) => theme.colors.accent2};
    font-size: 11px;
    font-weight: 800;
    border: 1px solid ${({ theme }) => theme.colors.border};
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .scroll::-webkit-scrollbar {
    width: 12px;
  }
  .scroll::-webkit-scrollbar-thumb {
    background: #d0d0d0;
    border-radius: 10px;
    border: 3px solid transparent;
    background-clip: content-box;
  }
  .scroll {
    scrollbar-width: thin;
    scrollbar-color: #d0d0d0 transparent;
  }
`;
