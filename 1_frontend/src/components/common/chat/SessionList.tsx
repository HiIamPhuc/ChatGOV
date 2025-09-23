import styled from "styled-components";
import SessionItem from "./SessionItem";

export type Session = { id: string; title: string; active?: boolean };

type Props = {
  items: Session[];
  onSelect?: (id: string) => void;
  onRename?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export default function SessionList({
  items,
  onSelect,
  onRename,
  onDelete,
}: Props) {
  if (!items?.length) return <Empty className="empty">Chưa có phiên nào</Empty>;
  return (
    <Wrap>
      {/* Scroll ở .list, nhưng menu của item không bị cắt bằng cách dùng portal */}
      <div className="list">
        {items.map((s) => (
          <SessionItem
            key={s.id}
            title={s.title}
            active={!!s.active}
            onClick={() => onSelect?.(s.id)}
            onRename={() => onRename?.(s.id)}
            onDelete={() => onDelete?.(s.id)}
          />
        ))}
      </div>
    </Wrap>
  );
}

/* ============ styles ============ */
const Wrap = styled.div`
  min-height: 0;
  .list {
    max-height: 100%;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-right: 2px; /* chừa chút cho scrollbar khỏi đè */
  }

  /* Scrollbar gọn */
  .list::-webkit-scrollbar {
    width: 10px;
  }
  .list::-webkit-scrollbar-thumb {
    background: #d6d6d6;
    border-radius: 10px;
    border: 3px solid transparent;
    background-clip: content-box;
  }
  .list {
    scrollbar-width: thin;
    scrollbar-color: #d6d6d6 transparent;
  }
`;

const Empty = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  padding: 6px 4px;
`;
