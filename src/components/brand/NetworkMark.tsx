import { cn } from "@/lib/utils";

/** Silueta de cada red. El color de marca va en el recuadro, el glifo en blanco. */
export type NetworkId =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "youtube"
  | "linkedin"
  | "tiktok"
  | "spotify"
  | "email"
  | "chat";

const TILE: Record<NetworkId, string> = {
  whatsapp: "bg-[#25D366]",
  instagram: "bg-[linear-gradient(135deg,#f9ce34_0%,#ee2a7b_48%,#6228d7_100%)]",
  facebook: "bg-[#1877F2]",
  youtube: "bg-[#FF0033]",
  linkedin: "bg-[#0A66C2]",
  tiktok: "bg-[#111111]",
  spotify: "bg-[#1DB954]",
  email: "bg-[#C2410C]",
  chat: "bg-[#4F46E5]",
};

export function NetworkMark({
  id,
  className,
}: {
  id: NetworkId;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": true as const,
  };

  if (id === "whatsapp") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.76 13.88c-.24.68-1.2 1.24-1.96 1.4-.52.11-1.2.2-3.48-.75-2.92-1.21-4.8-4.16-4.95-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.26-.29.58-.36.77-.36h.55c.18 0 .41-.07.64.49.24.58.82 2 .89 2.15.07.14.12.32.02.51-.1.19-.14.31-.28.48-.14.17-.3.37-.42.5-.14.14-.28.29-.12.56.16.27.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.17-.19.7-.81.88-1.09.19-.27.37-.23.62-.14.26.1 1.62.76 1.9.9.28.14.46.21.53.33.07.12.07.68-.17 1.36z" />
      </svg>
    );
  }

  if (id === "instagram") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2zM17.4 6.9a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0z" />
        <path d="M12 2.2c2.7 0 3 .01 4.06.06 2.7.12 4 1.4 4.12 4.08.05 1.06.06 1.36.06 4.06s-.01 3-.06 4.06c-.12 2.68-1.42 3.96-4.12 4.08-1.06.05-1.36.06-4.06.06s-3-.01-4.06-.06c-2.7-.12-4-1.4-4.12-4.08C3.77 15.4 3.76 15.1 3.76 12.4s.01-3 .06-4.06c.12-2.68 1.42-3.96 4.12-4.08C9 2.21 9.3 2.2 12 2.2zm0-1.7c-2.74 0-3.08.01-4.16.06-3.52.16-5.48 2.1-5.64 5.6C2.14 7.24 2.13 7.58 2.13 10.3v3.4c0 2.72.01 3.06.07 4.14.16 3.5 2.12 5.44 5.64 5.6 1.08.05 1.42.06 4.16.06s3.08-.01 4.16-.06c3.52-.16 5.48-2.1 5.64-5.6.06-1.08.07-1.42.07-4.14v-3.4c0-2.72-.01-3.06-.07-4.14-.16-3.5-2.12-5.44-5.64-5.6C15.08.51 14.74.5 12 .5z" />
      </svg>
    );
  }

  if (id === "facebook") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M14.2 20.5v-6.2h2.1l.3-2.4h-2.4V10.4c0-.7.2-1.2 1.2-1.2h1.3V7.1c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3v1.6H9.2v2.4h2.4v6.2h2.6z" />
      </svg>
    );
  }

  if (id === "youtube") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M9.2 7.6v8.8L16.8 12 9.2 7.6z" />
      </svg>
    );
  }

  if (id === "linkedin") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M5.7 9.2H2.8V20h2.9V9.2zM4.2 3.6A1.7 1.7 0 1 0 4.2 7a1.7 1.7 0 0 0 0-3.4zM20.2 20h-2.9v-5.6c0-1.6-.6-2.6-2-2.6-1 0-1.6.7-1.9 1.4-.1.2-.1.6-.1.9V20H10.4s.04-9.3 0-10.3h2.9v1.5c.4-.6 1.1-1.5 2.7-1.5 2 0 3.5 1.3 3.5 4.1V20z" />
      </svg>
    );
  }

  if (id === "tiktok") {
    return (
      <svg {...common}>
        <path
          fill="#25F4EE"
          d="M13.2 4.1h2a4.4 4.4 0 0 0 3.2 3v2a6.4 6.4 0 0 1-3.2-.9v5.8a5 5 0 1 1-5-5c.3 0 .5 0 .8.1v2.3a2.8 2.8 0 1 0 2 2.6V4.1z"
          transform="translate(-0.7 0.35)"
        />
        <path
          fill="#FE2C55"
          d="M13.2 4.1h2a4.4 4.4 0 0 0 3.2 3v2a6.4 6.4 0 0 1-3.2-.9v5.8a5 5 0 1 1-5-5c.3 0 .5 0 .8.1v2.3a2.8 2.8 0 1 0 2 2.6V4.1z"
          transform="translate(0.7 -0.25)"
        />
        <path
          fill="currentColor"
          d="M13.2 4.1h2a4.4 4.4 0 0 0 3.2 3v2a6.4 6.4 0 0 1-3.2-.9v5.8a5 5 0 1 1-5-5c.3 0 .5 0 .8.1v2.3a2.8 2.8 0 1 0 2 2.6V4.1z"
        />
      </svg>
    );
  }

  if (id === "spotify") {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M7 9.4c3.3-1 6.8-.8 9.8.9" />
        <path d="M7.7 12.5c2.6-.8 5.3-.6 7.6.7" />
        <path d="M8.4 15.5c1.9-.5 3.9-.4 5.5.5" />
      </svg>
    );
  }

  if (id === "email") {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M3.5 6.5h17v11h-17z" />
        <path d="M3.8 7.2 12 12.4l8.2-5.2" />
      </svg>
    );
  }

  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M5 6.2h14v8.2H9.2L5 18.2V6.2z" />
    </svg>
  );
}

export function NetworkTile({
  id,
  className,
}: {
  id: NetworkId;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden text-white",
        TILE[id],
        className
      )}
    >
      <NetworkMark id={id} className="h-[58%] w-[58%]" />
    </span>
  );
}
