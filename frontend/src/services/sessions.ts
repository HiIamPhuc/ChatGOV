import { api } from "@/utils/http";
import {
  appendMockMessages,
  autoNameMockSession,
  buildMockAssistantReply,
  createMockSession,
  delay,
  deleteMockSession,
  getMockHistory,
  isBypassAuthEnabled,
  listMockSessions,
  renameMockSession,
} from "@/dev/bypass";

export type ChatSession = {
  session_id: string;
  user_id: string;
  title?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_message_preview?: string | null;
  messages_count: number;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

function normalizeRole(raw?: string | null): "user" | "assistant" {
  const r = (raw || "").toLowerCase();
  if (r === "user" || r === "human") return "user";
  return "assistant";
}

export async function listSessions(): Promise<ChatSession[]> {
  if (isBypassAuthEnabled) {
    await delay();
    return listMockSessions();
  }

  const { data } = await api.get("/api/chat/sessions");
  return data;
}

export async function getHistory(
  sessionId: string
): Promise<{ session_id: string; messages: ChatMessage[] }> {
  if (isBypassAuthEnabled) {
    await delay();
    return { session_id: sessionId, messages: getMockHistory(sessionId) };
  }

  const { data } = await api.get("/api/chat/history", {
    params: { session_id: sessionId },
  });

  const filtered = filterDisplayableMessages(data?.messages || []);
  const norm: ChatMessage[] = filtered.map((m: any) => ({
    role: normalizeRole(m?.role),
    content: toPlainText(m?.content),
  }));

  return { session_id: data?.session_id, messages: norm };
}

export async function renameSession(
  sessionId: string,
  title: string
): Promise<void> {
  if (isBypassAuthEnabled) {
    await delay();
    renameMockSession(sessionId, title);
    return;
  }

  await api.put(`/api/chat/sessions/${encodeURIComponent(sessionId)}/title`, {
    title,
  });
}

export async function autoNameSession(
  sessionId: string
): Promise<{ ok: boolean; session_id: string; title: string }> {
  if (isBypassAuthEnabled) {
    await delay();
    return autoNameMockSession(sessionId);
  }

  const { data } = await api.post(
    `/api/chat/sessions/${encodeURIComponent(sessionId)}/autoname`
  );
  return data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (isBypassAuthEnabled) {
    await delay();
    deleteMockSession(sessionId);
    return;
  }

  await api.delete(`/api/chat/sessions/${encodeURIComponent(sessionId)}`);
}

export async function startSession(): Promise<{ session_id: string }> {
  if (isBypassAuthEnabled) {
    await delay();
    return createMockSession();
  }

  const { data } = await api.post("/api/chat/start_session", {});
  return data;
}

function toPlainText(val: any): string {
  if (typeof val === "string") return val;

  if (Array.isArray(val)) {
    return val.map((p) => toPlainText(p?.text ?? p?.content ?? p)).join("");
  }

  if (val && typeof val === "object") {
    if (typeof (val as any).text === "string") return (val as any).text;
    if ((val as any).content != null) return toPlainText((val as any).content);
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }

  return String(val ?? "");
}

function filterDisplayableMessages(raw: any[]): any[] {
  return (raw || []).filter((m) => {
    const role = String(m?.role || "").toLowerCase();
    const isUser = role === "user" || role === "human";
    const isAssistant = role === "assistant" || role === "ai";

    const emptyToolCalls =
      !m?.tool_calls ||
      (Array.isArray(m.tool_calls) && m.tool_calls.length === 0);

    const text =
      typeof m?.content === "string"
        ? m.content
        : JSON.stringify(m?.content ?? "");
    const hasText = text.trim().length > 0;

    return (isUser && hasText) || (isAssistant && emptyToolCalls && hasText);
  });
}

function resolveApiUrl(path: string): string {
  const base = (api.defaults?.baseURL as string) || "/api";
  if (/^https?:\/\//i.test(base)) {
    const u = new URL(
      path.replace(/^\//, ""),
      base.endsWith("/") ? base : `${base}/`
    );
    return u.toString();
  }

  const prefix = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${window.location.origin}${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}

export function streamChat(
  sessionId: string,
  message: string,
  onToken: (token: string) => void
): Promise<void> {
  if (isBypassAuthEnabled) {
    return new Promise(async (resolve) => {
      const reply = buildMockAssistantReply(message);
      appendMockMessages(sessionId, [
        { role: "user", content: message },
        { role: "assistant", content: reply },
      ]);

      for (const token of reply.split(" ")) {
        onToken(`${token} `);
        await delay(40);
      }

      resolve();
    });
  }

  return new Promise(async (resolve, reject) => {
    try {
      const url = resolveApiUrl("/api/chat/");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        credentials: "include",
        body: JSON.stringify({ session_id: sessionId, message }),
      });

      if (!res.ok || !res.body) {
        reject(new Error(`HTTP ${res.status}`));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sepIndex: number;
        while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);

          const parts: string[] = [];
          for (const line of rawEvent.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            parts.push(trimmed.slice(5).trim());
          }
          const payload = parts.join("\n");

          if (!payload) continue;
          if (payload === "[DONE]") {
            resolve();
            return;
          }
          if (payload.startsWith("ERROR:")) {
            reject(new Error(payload));
            return;
          }

          let token = "";
          try {
            const obj = JSON.parse(payload);
            token = obj?.delta ?? "";
          } catch {
            token = payload;
          }
          if (token) onToken(token);
        }
      }

      resolve();
    } catch (err) {
      reject(err as any);
    }
  });
}
