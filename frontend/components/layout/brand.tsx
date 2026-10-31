export function BrandMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect width="40" height="40" rx="11" fill="#24795c" />
      <g
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 31V11M20 19c-7 0-10-3-10-8 7 0 10 3 10 8ZM20 26c-7 0-10-3-10-8 7 0 10 3 10 8ZM20 22c7 0 10-3 10-8-7 0-10 3-10 8ZM20 15c5 0 7-3 7-7-5 0-7 3-7 7Z" />
      </g>
    </svg>
  );
}
