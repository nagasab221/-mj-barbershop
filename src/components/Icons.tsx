/**
 * Minimal 24×24 stroke icon set, drawn to match the site's fine-line
 * aesthetic. All icons inherit `currentColor`.
 */
type IconProps = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
};

export function ScissorsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="6" cy="6" r="2.6" />
      <circle cx="6" cy="18" r="2.6" />
      <path d="M8.2 7.7 20 19.5M20 4.5 8.2 16.3M14.7 9.8l-2.6 2.4" />
    </svg>
  );
}

export function RazorIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m3 21 6.5-6.5" />
      <path d="M8 12.5 11.5 16l9-9c.7-.7.7-1.8 0-2.5L19 3c-.7-.7-1.8-.7-2.5 0l-9 9Z" />
      <path d="m13.5 7.5 3 3" />
    </svg>
  );
}

export function StarIcon({ className, filled = true }: IconProps & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden
    >
      <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.1l-5.7 3.1 1.2-6.3L2.8 9.5l6.4-.8L12 2.8z" />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.04 2a9.9 9.9 0 0 0-8.51 14.96L2 22l5.18-1.5A9.9 9.9 0 1 0 12.04 2Zm0 1.67a8.24 8.24 0 1 1-4.19 15.32l-.3-.18-3.07.89.91-2.99-.2-.31a8.24 8.24 0 0 1 6.85-12.73Zm-3.4 3.83c-.19 0-.5.07-.76.35-.26.28-1 .98-1 2.4 0 1.4 1.02 2.76 1.16 2.95.14.19 1.97 3.16 4.86 4.3 2.4.95 2.89.76 3.41.71.52-.05 1.68-.68 1.92-1.34.24-.66.24-1.23.17-1.35-.07-.12-.26-.19-.55-.33-.28-.14-1.68-.83-1.94-.92-.26-.1-.45-.14-.64.14-.19.28-.73.92-.9 1.11-.16.19-.33.21-.61.07-.28-.14-1.2-.44-2.28-1.4a8.55 8.55 0 0 1-1.58-1.96c-.16-.28-.02-.44.12-.58.13-.13.29-.33.43-.5.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.5-.07-.14-.63-1.54-.87-2.1-.23-.55-.46-.48-.64-.49l-.56-.01Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M16.6 3c.4 1.9 1.7 3.4 3.9 3.6v2.9c-1.5 0-2.8-.4-3.9-1.2v6.2a5.9 5.9 0 1 1-5.9-5.9c.3 0 .7 0 1 .1v3a2.9 2.9 0 1 0 2 2.8V3h2.9Z" />
    </svg>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 1.8" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3.5 6.5 8.5 6 8.5-6" />
    </svg>
  );
}

export function ArrowIcon({ className }: IconProps) {
  return (
    <svg {...base} className={`rtl:-scale-x-100 ${className ?? ''}`}>
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  );
}
