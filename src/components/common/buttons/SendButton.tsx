import React from "react";
import styled from "styled-components";

type Props = {
  onClick: () => void;
  label?: string;
  size?: number; // px
  disabled?: boolean;
};

const SendButton: React.FC<Props> = ({
  onClick,
  label = "Gửi",
  size = 18,
  disabled,
}) => {
  return (
    <SendWrap>
      <button
        onClick={onClick}
        aria-label={label}
        title={label}
        disabled={disabled}
        // truyền kích thước icon qua CSS var
        style={{ ["--icon" as any]: `${size}px` }}
      >
        <div className="plane">
          <div className="plane-bob">
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
        <span className="label">{label}</span>
      </button>
    </SendWrap>
  );
};

export default SendButton;

const SendWrap = styled.div`
  button {
    /* layout */
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.35em;
    overflow: hidden;
    white-space: nowrap;

    /* sizing */
    --icon: 18px; /* fallback nếu không truyền style */
    --padX: 0.9em;
    --gapL: 0.45em; /* khoảng cách text so với icon “ảo” */
    font-family: inherit;
    font-size: 0.95rem;
    color: #fff;
    padding: 0.55em var(--padX);
    /* chừa khoảng bên trái cho icon dù icon đã absolute */
    padding-left: calc(var(--padX) + var(--icon) + var(--gapL));
    border: none;
    border-radius: 12px;
    cursor: pointer;

    /* motion */
    transition: transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease,
      opacity 0.15s ease;

    /* theme */
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.colors.accent},
      ${({ theme }) => theme.colors.accent2}
    );
    box-shadow: 0 6px 18px rgba(206, 122, 88, 0.24);
  }

  button:hover {
    filter: brightness(0.97);
  }
  button:active {
    transform: scale(0.98);
  }
  button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(206, 122, 88, 0.25),
      0 6px 18px rgba(206, 122, 88, 0.24);
  }

  /* ICON (máy bay) — đặt absolute để không đẩy chữ */
  .plane {
    position: absolute;
    left: var(--padX); /* vị trí ban đầu sát trái */
    top: 50%;
    transform: translateY(-50%);
    width: var(--icon);
    height: var(--icon);
    display: grid;
    place-items: center;
    transition: left 0.35s ease, transform 0.35s ease, opacity 0.2s ease;
    transform-origin: center center;
  }

  /* bob nhẹ khi hover */
  .plane-bob {
    transition: transform 0.35s ease;
  }
  @keyframes fly-1 {
    from {
      transform: translateY(0.08em);
    }
    to {
      transform: translateY(-0.08em);
    }
  }

  /* LABEL — trượt ra ngoài bên phải khi hover, không đổi width button */
  .label {
    display: inline-block;
    transition: transform 0.35s ease, opacity 0.35s ease;
    will-change: transform;
  }

  /* HOVER STATE: máy bay vào giữa + xoay ngang, chữ chạy ra ngoài */
  button:hover .plane {
    left: 50%;
    transform: translate(-50%, -50%) rotate(45deg) scale(1.08);
  }
  button:hover .plane-bob {
    animation: fly-1 0.6s ease-in-out infinite alternate;
  }
  button:hover .label {
    transform: translateX(120%);
    opacity: 0;
  }

  /* DISABLED */
  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
    filter: grayscale(0.1);
  }

  /* MOBILE: ẩn chữ để tiết kiệm chỗ */
  @media (max-width: 600px) {
    .label {
      display: none;
    }
  }

  /* giảm motion nếu user chọn reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .plane,
    .label {
      transition: none;
      animation: none;
    }
  }
`;
