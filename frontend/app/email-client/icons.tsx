import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
};

export function StarIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 2.75l2.87 6.09 6.63.99-4.8 4.66 1.13 6.58L12 17.93 6.17 21.07l1.13-6.58-4.8-4.66 6.63-.99L12 2.75z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SearchIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10.5 3a7.5 7.5 0 105.03 13.06l4.2 4.2a1 1 0 001.41-1.42l-4.2-4.19A7.5 7.5 0 0010.5 3zm0 2a5.5 5.5 0 110 11 5.5 5.5 0 010-11z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ChevronLeftRightIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.7 7.3a1 1 0 010 1.4L6.41 11H11a1 1 0 110 2H6.41l2.3 2.3a1 1 0 11-1.42 1.4l-4-4a1 1 0 010-1.4l4-4a1 1 0 011.41 0zm6.6 0a1 1 0 011.41 0l4 4a1 1 0 010 1.4l-4 4a1 1 0 01-1.41-1.4L17.59 13H13a1 1 0 110-2h4.59l-2.3-2.3a1 1 0 010-1.4z"
        fill="currentColor"
      />
    </svg>
  );
}

export function DotsIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 6.5a1.75 1.75 0 110 3.5 1.75 1.75 0 010-3.5zm0 7a1.75 1.75 0 110 3.5 1.75 1.75 0 010-3.5zm0 7a1.75 1.75 0 110 3.5 1.75 1.75 0 010-3.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ArchiveIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M4 7a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm2 0v2h12V7H6zm-1 6a1 1 0 011-1h14a1 1 0 011 1v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6zm6 2a1 1 0 000 2h2a1 1 0 000-2h-2z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ForwardIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M13 9V6.5a1 1 0 011.7-.7l6 6a1 1 0 010 1.4l-6 6a1 1 0 01-1.7-.7V16c-4.5 0-7.55 1.4-9.7 4.4a1 1 0 01-1.8-.7C2.3 13.3 6.6 9.6 13 9z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CheckIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M9.2 16.6L4.9 12.3a1 1 0 011.4-1.4l2.9 2.9 8-8a1 1 0 011.4 1.4l-8.7 8.7a1 1 0 01-1.4 0z" fill="currentColor" />
    </svg>
  );
}

export function PaperclipIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M8 12.5l7.6-7.6a3 3 0 114.2 4.2l-9 9a5 5 0 01-7.1-7.1l9.2-9.2a1 1 0 011.4 1.4L5.1 12.4a3 3 0 104.2 4.2l9-9a1 1 0 10-1.4-1.4L9.4 13.9a1 1 0 01-1.4-1.4z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SmileIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16zm-3 9a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zm-6.3 4.2a1 1 0 011.4.1 2.8 2.8 0 004 0 1 1 0 111.5 1.3 4.8 4.8 0 01-7 0 1 1 0 01.1-1.4z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TemplateIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2zm0 2v14h12V5H6zm2 2h8a1 1 0 010 2H8a1 1 0 010-2zm0 4h8a1 1 0 010 2H8a1 1 0 010-2zm0 4h6a1 1 0 010 2H8a1 1 0 010-2z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CaretDownIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
