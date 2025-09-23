import styled from "styled-components";

const LoaderTyping = () => (
  <StyledWrapper>
    <div className="loader-wrapper">
      {"Generating".split("").map((ch, i) => (
        <span className="loader-letter" key={i}>
          {ch}
        </span>
      ))}
      <div className="loader" />
    </div>
  </StyledWrapper>
);

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  .loader-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 120px;
    margin: 2rem;
    font-size: 1.2rem;
    font-weight: 600;
    color: #fff;
    scale: 1.6;
  }
  .loader {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: transparent;
    mask: repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent 6px,
      black 7px,
      black 8px
    );
  }
  .loader::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image: radial-gradient(
        circle at 50% 50%,
        #ff0 0%,
        transparent 50%
      ),
      radial-gradient(circle at 45% 45%, #f00 0%, transparent 45%),
      radial-gradient(circle at 55% 55%, #0ff 0%, transparent 45%),
      radial-gradient(circle at 45% 55%, #0f0 0%, transparent 45%),
      radial-gradient(circle at 55% 45%, #00f 0%, transparent 45%);
    mask: radial-gradient(
      circle at 50% 50%,
      transparent 0%,
      transparent 10%,
      black 25%
    );
    animation: transform-animation 2s infinite alternate
        cubic-bezier(0.6, 0.8, 0.5, 1),
      opacity-animation 4s infinite;
  }
  @keyframes transform-animation {
    from {
      transform: translate(-55%);
    }
    to {
      transform: translate(55%);
    }
  }
  @keyframes opacity-animation {
    0%,
    100% {
      opacity: 0;
    }
    15% {
      opacity: 1;
    }
    65% {
      opacity: 0;
    }
  }
  .loader-letter {
    display: inline-block;
    opacity: 0;
    animation: loader-letter-anim 4s infinite linear;
    z-index: 2;
  }
  .loader-letter:nth-child(1) {
    animation-delay: 0.1s;
  }
  .loader-letter:nth-child(2) {
    animation-delay: 0.205s;
  }
  .loader-letter:nth-child(3) {
    animation-delay: 0.31s;
  }
  .loader-letter:nth-child(4) {
    animation-delay: 0.415s;
  }
  .loader-letter:nth-child(5) {
    animation-delay: 0.521s;
  }
  .loader-letter:nth-child(6) {
    animation-delay: 0.626s;
  }
  .loader-letter:nth-child(7) {
    animation-delay: 0.731s;
  }
  .loader-letter:nth-child(8) {
    animation-delay: 0.837s;
  }
  .loader-letter:nth-child(9) {
    animation-delay: 0.942s;
  }
  .loader-letter:nth-child(10) {
    animation-delay: 1.047s;
  }
  @keyframes loader-letter-anim {
    0% {
      opacity: 0;
    }
    5% {
      opacity: 1;
      text-shadow: 0 0 4px #fff;
      transform: scale(1.1) translateY(-2px);
    }
    20% {
      opacity: 0.2;
    }
    100% {
      opacity: 0;
    }
  }
`;

export default LoaderTyping;
