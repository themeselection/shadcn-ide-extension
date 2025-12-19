import type { FC, HTMLAttributes } from 'react';

export type LogoColor =
  | 'default'
  | 'black'
  | 'white'
  | 'zinc'
  | 'current'
  | 'gradient';

export type LoadingSpeed = 'slow' | 'fast';

export interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  color?: LogoColor;
  loading?: boolean;
  loadingSpeed?: LoadingSpeed;
}

export const Logo: FC<LogoProps> = () => {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        width="40"
        height="40"
        rx="20"
        transform="matrix(-4.37114e-08 1 1 4.37114e-08 1.74846e-06 0)"
        fill="#171717"
      />
      <path
        d="M8.75586 20.1258L16.1303 20.1258C18.5549 20.1258 20.5205 18.1603 20.5205 15.7356L20.5205 8.56616"
        stroke="#FAFAFA"
        stroke-width="2.43902"
      />
      <path
        d="M32.2852 20.3198L24.9107 20.3198C22.4861 20.3198 20.5205 22.2854 20.5205 24.7101L20.5205 31.8795"
        stroke="#FAFAFA"
        stroke-width="2.43902"
      />
      <line
        y1="-1.21951"
        x2="7.09397"
        y2="-1.21951"
        transform="matrix(0.70291 -0.711279 -0.711279 -0.70291 11.123 28.1847)"
        stroke="#FAFAFA"
        stroke-width="2.43902"
      />
      <line
        y1="-1.21951"
        x2="7.09397"
        y2="-1.21951"
        transform="matrix(0.70291 -0.711279 -0.711279 -0.70291 23.5781 15.6893)"
        stroke="#FAFAFA"
        stroke-width="2.43902"
      />
      <line
        y1="-1.21951"
        x2="7.09397"
        y2="-1.21951"
        transform="matrix(-0.707107 -0.707107 -0.707107 0.707107 15.8486 17.1644)"
        stroke="#FAFAFA"
        stroke-width="2.43902"
      />
      <line
        y1="-1.21951"
        x2="7.09397"
        y2="-1.21951"
        transform="matrix(-0.707107 -0.707107 -0.707107 0.707107 28.5645 29.8483)"
        stroke="#FAFAFA"
        stroke-width="2.43902"
      />
    </svg>
  );
};
