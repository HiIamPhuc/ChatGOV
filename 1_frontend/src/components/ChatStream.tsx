import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

type Msg = { id: string; role: "user"|"assistant"; content: string; };
export default function ChatStream({ messages }: {messages: Msg[]}) {
  return (
    <div className="flex-1 overflow-auto p-4 space-y-3">
      {messages.map(m=>(
        <div key={m.id} className={m.role==="user" ? "text-right" : ""}>
          <div className={`inline-block max-w-prose rounded-2xl px-3 py-2 ${m.role==="user"?"bg-gray-900 text-white":"bg-gray-100"}`}>
            {m.role==="assistant"
              ? <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{m.content}</ReactMarkdown>
              : <span>{m.content}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
