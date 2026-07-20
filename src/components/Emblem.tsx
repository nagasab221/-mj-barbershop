/**
 * Vintage circular emblem, double ring, serif "MJ" monogram, EST line.
 * Inherits color from `currentColor` so it can be tinted via text classes.
 */
export default function Emblem({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="60" cy="60" r="57" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
      {/* corner diamonds */}
      <path d="M60 8 l2.6 3.5 L60 15 l-2.6 -3.5 Z" fill="currentColor" />
      <path d="M60 105 l2.6 3.5 L60 112 l-2.6 -3.5 Z" fill="currentColor" />
      {/* scissors mark above the monogram */}
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <circle cx="53.5" cy="30" r="2.6" fill="none" />
        <circle cx="66.5" cy="30" r="2.6" fill="none" />
        <path d="M55.8 31.6 66 40.5M64.2 31.6 54 40.5" />
      </g>
      {/* monogram */}
      <text
        x="60"
        y="74"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="var(--font-playfair), Georgia, serif"
        fontSize="30"
        letterSpacing="2"
      >
        MJ
      </text>
      {/* est line */}
      <path d="M34 86 h14 M72 86 h14" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
      <text
        x="60"
        y="89.5"
        textAnchor="middle"
        fill="currentColor"
        fontSize="7.5"
        letterSpacing="2.5"
        fontFamily="var(--font-inter), sans-serif"
      >
        EST
      </text>
    </svg>
  );
}
