type AttendanceTeacherMood = "happy" | "sad";

interface AttendanceTeacherIconProps {
  mood: AttendanceTeacherMood;
  className?: string;
}

/** Profesor institucional — expresión clara según confirmación de asistencia. */
export function AttendanceTeacherIcon({ mood, className }: AttendanceTeacherIconProps) {
  const isHappy = mood === "happy";

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* Aura de ánimo */}
      <circle
        cx="32"
        cy="30"
        r="27"
        fill={isHappy ? "#d8f3e4" : "#dbe8f4"}
        opacity="0.9"
      />

      {/* Cuerpo académico */}
      <path
        d="M13 58 C13 47 20 43 32 43 C44 43 51 47 51 58 Z"
        fill={isHappy ? "#003366" : "#3d5f7c"}
      />
      <path
        d="M25 43 L32 51 L39 43"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect x="28.5" y="37" width="7" height="7" rx="2" fill="#f0c9a6" />

      {/* Rostro */}
      <circle cx="32" cy="27" r="15" fill="#f0c9a6" />

      {/* Cabello */}
      <path
        d="M17 25 C17 14 24 10 32 10 C40 10 47 14 47 25 C47 18 42 15 32 15 C22 15 17 18 17 25 Z"
        fill="#4a3728"
      />

      {/* Anteojos — marco simple */}
      <circle cx="24.5" cy="27" r="6" fill="none" stroke="#003366" strokeWidth="2" />
      <circle cx="39.5" cy="27" r="6" fill="none" stroke="#003366" strokeWidth="2" />
      <path d="M30.5 27 H33.5" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" />

      {/* Cejas — muy marcadas */}
      {isHappy ? (
        <>
          <path
            d="M18 20 Q24 16 30 20"
            stroke="#4a3728"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M34 20 Q40 16 46 20"
            stroke="#4a3728"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M18 22 L30 25"
            stroke="#4a3728"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M46 22 L34 25"
            stroke="#4a3728"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      )}

      {/* Ojos */}
      {isHappy ? (
        <>
          <path
            d="M20 27 Q24.5 23 29 27"
            stroke="#003366"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M35 27 Q39.5 23 44 27"
            stroke="#003366"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M20 28 Q24.5 31 29 28"
            stroke="#003366"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M35 28 Q39.5 31 44 28"
            stroke="#003366"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M19 30 Q24.5 33 30 30"
            stroke="#003366"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M34 30 Q39.5 33 45 30"
            stroke="#003366"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            opacity="0.55"
          />
        </>
      )}

      {/* Boca — la señal principal */}
      {isHappy ? (
        <>
          <path
            d="M22 34 Q32 44 42 34 Z"
            fill="#003366"
          />
          <path
            d="M24 34.5 Q32 40 40 34.5"
            fill="#fff"
          />
          <circle cx="20" cy="32" r="2.6" fill="#f4a5a0" opacity="0.65" />
          <circle cx="44" cy="32" r="2.6" fill="#f4a5a0" opacity="0.65" />
          {/* Brillo de alegría */}
          <path
            d="M48 12 L49.5 15 L52.5 15.5 L50 18 L50.5 21 L48 19.5 L45.5 21 L46 18 L43.5 15.5 L46.5 15 Z"
            fill="#c9a227"
          />
        </>
      ) : (
        <>
          <path
            d="M22 38 Q32 31 42 38"
            stroke="#003366"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="32" cy="37.5" rx="4" ry="2" fill="#003366" opacity="0.12" />
          <ellipse
            className="attendance-no-feedback__tear"
            cx="21"
            cy="31"
            rx="2"
            ry="3.2"
            fill="#4a90c4"
          />
          <ellipse
            className="attendance-no-feedback__tear attendance-no-feedback__tear--delay"
            cx="43"
            cy="32"
            rx="1.7"
            ry="2.8"
            fill="#4a90c4"
          />
        </>
      )}

      {/* Libro académico */}
      <rect x="8" y="47" width="11" height="9" rx="1.2" fill={isHappy ? "#4a90c4" : "#6b8fad"} />
      <rect x="9" y="48" width="9" height="7" rx="0.6" fill="#fff" opacity="0.9" />
      <path d="M13.5 48 V55" stroke={isHappy ? "#4a90c4" : "#6b8fad"} strokeWidth="0.9" />
    </svg>
  );
}
