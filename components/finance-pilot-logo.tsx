import { cn } from '@/lib/utils'

/** Logo marque (icône + texte), fond transparent — couleurs via le thème Tailwind. */
export function FinancePilotLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 44"
      role="img"
      aria-hidden
      className={cn('h-9 w-auto max-w-[min(52vw,13.5rem)] shrink-0 object-contain object-left sm:max-w-[14.5rem]', className)}
    >
      <rect x="8" y="6" width="36" height="32" rx="7" className="fill-primary" />
      <path
        className="stroke-primary-foreground/55"
        strokeWidth="0.65"
        d="M12 14h28M12 18.5h28M12 23h28M12 27.5h28"
      />
      <path
        fill="none"
        className="stroke-primary-foreground/85"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 29l6-8 5 3 7-11 5 3"
      />
      <circle cx="20" cy="21" r="1.45" className="fill-primary-foreground" />
      <circle cx="26" cy="24" r="1.45" className="fill-primary-foreground" />
      <circle cx="33" cy="13" r="1.45" className="fill-primary-foreground" />
      <circle cx="38" cy="16" r="1.45" className="fill-primary-foreground" />
      <path className="fill-primary-foreground" d="m36 9 3.2 1.6-1.6 1 .2 2.6-2.4-1.4L36 9Z" />
      <text
        x="52"
        y="16"
        className="fill-muted-foreground"
        style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontSize: '8.5px', fontWeight: 500 }}
      >
        Finance
      </text>
      <text
        x="52"
        y="31"
        className="fill-foreground"
        style={{
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.2em',
        }}
      >
        PILOT
      </text>
      <path strokeWidth="0.9" d="M52 34h72" className="stroke-primary" />
    </svg>
  )
}
