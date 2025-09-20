export type AppTheme = {
  colors: {
    bg: string;
    surface: string;
    surface2: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    danger: string;
  };
  radii: { lg: string; md: string; sm: string };
  shadow: string;
};

export const theme: AppTheme = {
  colors: {
    bg: "#0f0f10",
    surface: "#171717",
    surface2: "#1f1f1f",
    border: "#2c2c2c",
    primary: "#eaeaea",
    secondary: "#a6a6a6",
    accent: "#6c6c6c",
    success: "#3ad29f",
    danger: "#ff4d4d",
  },
  radii: { lg: "24px", md: "14px", sm: "8px" },
  shadow: "0 10px 30px rgba(0,0,0,.35)",
};
