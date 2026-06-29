/** Colores oficiales — Manual de Marca SEM */
export const colors = {
  primary: "#002A47",
  secondary: "#246AA1",
  accent: "#10BCE2",
  success: "#3ED6AF",
  light: "#8CE27F",
  white: "#FFFFFF",
  gray: {
    50: "#F5F7F9",
    100: "#E8ECF0",
    200: "#D1D9E0",
    300: "#A8B5C2",
    400: "#7A8FA3",
    500: "#5C7289",
    600: "#475A6E",
    700: "#354656",
    800: "#243340",
    900: "#141F29",
  },
} as const;

/** Alias semánticos derivados exclusivamente de la paleta oficial */
export const semanticColors = {
  info: colors.accent,
  warning: colors.light,
  error: colors.primary,
  neutral: colors.gray[500],
} as const;

export type ColorToken = keyof typeof colors | `gray.${keyof typeof colors.gray}`;
