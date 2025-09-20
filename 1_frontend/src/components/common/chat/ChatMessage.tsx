import styled from "styled-components";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

type Msg = { id:string; role:"user"|"assistant"; content:string; };
export default function ChatMessage({msg}:{msg:Msg}){
  return (
    <Item className={msg.role}>
      <div className="bubble">
        {msg.role==="assistant"
          ? <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{msg.content}</ReactMarkdown>
          : <span>{msg.content}</span>}
      </div>
    </Item>
  );
}

const Item = styled.div`
  display:flex; margin: 8px 0; justify-content:flex-start;
  &.user{ justify-content:flex-end; }
  .bubble{
    max-width: min(720px, 92%); padding: 12px 14px; border-radius: 16px;
    background:#121212; border:1px solid #2b2b2b; color:#eaeaea; line-height:1.5;
  }
  &.user .bubble{ background:#1f1f1f; border-color:#3a3a3a; }
`;
