export type AppTheme = {
  colors: {
    bg: string;
    surface: string;
    surface2: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;         // dùng cho nút/nhấn mạnh
    accent2: string;       
    success: string;
    danger: string;
  };
  radii: { lg: string; md: string; sm: string };
  shadow: string;
};

export const theme: AppTheme = {
  colors: {
    bg: "#f5f5f5",
    surface: "#ffffff",
    surface2: "#f9f9f9",
    border: "#e6e6e6",
    primary: "#222222",
    secondary: "#666666",
    accent: "#ce7a58",  
    accent2: "#903938",  
    success: "#2e7d32",
    danger:  "#c62828",
  },
  radii: { lg: "24px", md: "14px", sm: "8px" },
  shadow: "0 10px 30px rgba(0,0,0,.10)",
};
