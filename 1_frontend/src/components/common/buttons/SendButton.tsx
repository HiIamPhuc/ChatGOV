import React from "react";
import styled from "styled-components";

type Props = { onClick: () => void; label?: string; size?: number };

const SendButton: React.FC<Props> = ({
  onClick,
  label = "Send",
  size = 18,
}) => {
  return (
    <SendWrap>
      <button onClick={onClick} aria-label={label} title={label}>
        <div className="svg-wrapper-1">
          <div className="svg-wrapper">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={size}
              height={size}
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path
                fill="currentColor"
                d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
              />
            </svg>
          </div>
        </div>
        <span>{label}</span>
      </button>
    </SendWrap>
  );
};

export default SendButton;

const SendWrap = styled.div`
  button {
    font-family: inherit;
    font-size: 0.95rem;
    background: #466fff;
    color: #fff;
    padding: 0.55em 0.9em;
    padding-left: 0.8em;
    display: flex;
    align-items: center;
    gap: 0.35em;
    border: none;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s;
    cursor: pointer;
  }
  button:hover {
    background: #3b63f7;
  }
  button:active {
    transform: scale(0.97);
  }

  .svg-wrapper {
    transition: transform 0.3s ease-in-out;
  }
  button:hover .svg-wrapper {
    transform: translateX(0.35em) rotate(40deg) scale(1.05);
  }
  button span {
    transition: transform 0.25s ease-in-out;
  }
  button:hover span {
    transform: translateX(0.3em);
  }

  @media (max-width: 600px) {
    button span {
      display: none;
    }
  }
`;
