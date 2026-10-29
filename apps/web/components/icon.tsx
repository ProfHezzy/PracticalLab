import type { ReactNode, SVGProps } from "react";

const shapes: Record<string, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9M9 20v-6h6v6" />
    </>
  ),
  book: (
    <>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5z" />
      <path d="M4 16h16M8 6h8m-8 4h6" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6m-5 0v6L5 19a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-10V3" />
      <path d="M7 17h10" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14m-7-7 7 7-7 7" />
    </>
  ),
  spark: (
    <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 12 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
  ),
};

export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: keyof typeof shapes }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {shapes[name]}
    </svg>
  );
}
