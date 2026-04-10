import type { ChatMessage, ChatSession } from "@/services/sessions";
import type { Profile } from "@/services/profile";

const MOCK_USER_ID = "dev-user";
const PROFILE_KEY = "dev.profile";
const SESSIONS_KEY = "dev.sessions";
const HISTORY_KEY = "dev.histories";

export const isBypassAuthEnabled =
  String(import.meta.env.VITE_BYPASS_AUTH).toLowerCase() === "true";

export const mockUser = {
  id: MOCK_USER_ID,
  email: "dev@local.test",
  user_metadata: {
    full_name: "Dev User",
  },
};

type SessionHistoryMap = Record<string, ChatMessage[]>;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return safeParse(window.localStorage.getItem(key), fallback);
}

function writeLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function delay(ms = 120) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function includesAny(input: string, keywords: string[]) {
  return keywords.some((keyword) => input.includes(keyword));
}

export function buildMockAssistantReply(prompt: string) {
  const normalized = prompt.trim().toLowerCase();

  if (
    includesAny(normalized, [
      "khuyến mại",
      "khuyen mai",
      "đăng ký hoạt động khuyến mại",
      "dang ky hoat dong khuyen mai",
      "đăng ký khuyến mại",
      "dang ky khuyen mai",
    ])
  ) {
    return [
      "Tôi đã tra cứu nhanh thủ tục liên quan đến đăng ký hoạt động khuyến mại cho doanh nghiệp.",
      "",
      "Bạn nên kiểm tra kỹ thành phần hồ sơ, cơ quan tiếp nhận, thời hạn xử lý và biểu mẫu đính kèm trong các tài liệu dưới đây.",
      "",
      "| Tên tài liệu | Link tới tài liệu |",
      "| --- | --- |",
      "| Hồ sơ đăng ký hoạt động khuyến mại | [Mở tài liệu](https://csdl.dichvucong.gov.vn/web/jsp/download_file.jsp?ma=3fb17464c974c6b0) |",
      "| Biểu mẫu và hướng dẫn liên quan | [Mở tài liệu](https://csdl.dichvucong.gov.vn/web/jsp/download_file.jsp?ma=3fe12aa6a96e2ec3) |",
      "",
      "Nếu bạn muốn, tôi có thể tiếp tục giả lập bước tiếp theo như tóm tắt hồ sơ cần chuẩn bị, điều kiện thực hiện, hoặc cách nộp online.",
    ].join("\n");
  }

  return `Tôi đã tra cứu nhanh để hỗ trợ giao diện thử nghiệm.\n\nNội dung mẫu cho câu hỏi: "${prompt}"\n\n| Tên tài liệu | Link tới tài liệu |\n| --- | --- |\n| Tài liệu tham khảo mẫu | [Mở tài liệu](https://csdl.dichvucong.gov.vn/web/jsp/download_file.jsp?ma=3fb17464c974c6b0) |\n| Tài liệu bổ sung mẫu | [Mở tài liệu](https://csdl.dichvucong.gov.vn/web/jsp/download_file.jsp?ma=3fe12aa6a96e2ec3) |`;
}

export function getMockProfile(): Profile {
  const fallback: Profile = {
    id: MOCK_USER_ID,
    email: mockUser.email,
    name: "Dev User",
    age: 25,
    city: "Ho Chi Minh City",
    phone: "",
    dob: "2000-01-01",
  };

  const current = readLocal<Profile>(PROFILE_KEY, fallback);
  if (current.id !== MOCK_USER_ID) {
    return { ...fallback, ...current, id: MOCK_USER_ID, email: mockUser.email };
  }
  return current;
}

export function updateMockProfile(
  patch: Partial<Omit<Profile, "id" | "email">>
): Profile {
  const next = { ...getMockProfile(), ...patch, id: MOCK_USER_ID, email: mockUser.email };
  writeLocal(PROFILE_KEY, next);
  return next;
}

export function listMockSessions(): ChatSession[] {
  const sessions = readLocal<ChatSession[]>(SESSIONS_KEY, []);
  return [...sessions].sort((a, b) => {
    const at = new Date(a.updated_at || a.created_at || 0).getTime();
    const bt = new Date(b.updated_at || b.created_at || 0).getTime();
    return bt - at;
  });
}

export function getMockHistory(sessionId: string): ChatMessage[] {
  const histories = readLocal<SessionHistoryMap>(HISTORY_KEY, {});
  return histories[sessionId] || [];
}

export function createMockSession(): { session_id: string } {
  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();
  const next: ChatSession = {
    session_id: sessionId,
    user_id: MOCK_USER_ID,
    title: null,
    created_at: now,
    updated_at: now,
    last_message_preview: null,
    messages_count: 0,
  };

  writeLocal(SESSIONS_KEY, [next, ...listMockSessions()]);
  return { session_id: sessionId };
}

export function appendMockMessages(sessionId: string, messages: ChatMessage[]) {
  const histories = readLocal<SessionHistoryMap>(HISTORY_KEY, {});
  const nextHistory = [...(histories[sessionId] || []), ...messages];
  histories[sessionId] = nextHistory;
  writeLocal(HISTORY_KEY, histories);

  const sessions = listMockSessions().map((session) =>
    session.session_id === sessionId
      ? {
          ...session,
          updated_at: new Date().toISOString(),
          last_message_preview: messages[messages.length - 1]?.content || session.last_message_preview,
          messages_count: nextHistory.length,
        }
      : session
  );
  writeLocal(SESSIONS_KEY, sessions);
}

export function renameMockSession(sessionId: string, title: string) {
  const sessions = listMockSessions().map((session) =>
    session.session_id === sessionId
      ? { ...session, title, updated_at: new Date().toISOString() }
      : session
  );
  writeLocal(SESSIONS_KEY, sessions);
}

export function autoNameMockSession(sessionId: string): { ok: boolean; session_id: string; title: string } {
  const session = listMockSessions().find((item) => item.session_id === sessionId);
  const firstUserMessage = getMockHistory(sessionId).find((item) => item.role === "user");
  const title =
    session?.title ||
    firstUserMessage?.content?.trim()?.slice(0, 40) ||
    "New chat";

  renameMockSession(sessionId, title);
  return { ok: true, session_id: sessionId, title };
}

export function deleteMockSession(sessionId: string) {
  const sessions = listMockSessions().filter((session) => session.session_id !== sessionId);
  const histories = readLocal<SessionHistoryMap>(HISTORY_KEY, {});
  delete histories[sessionId];
  writeLocal(SESSIONS_KEY, sessions);
  writeLocal(HISTORY_KEY, histories);
}
