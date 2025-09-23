export type AppTheme = {
  colors: {
    bg: string;
    surface: string;
    surface2: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;      
    accent2: string;       
    success: string;
    danger: string;
  };
  radii: { lg: string; md: string; sm: string };
  shadow: string;
};

export const theme: AppTheme = {
  colors: {
    bg:       "#f3edea",   
    surface:  "#ffffff",
    surface2: "#fff8f4",   
    border:   "#efd8cd",   
    primary:  "#222222",
    secondary:"#7a6a66",   
    accent:   "#ce7a58",   // dùng cho chữ & icon tương tác
    accent2:  "#903938",   // dùng cho nút chính, hover, active
    success:  "#2e7d32",
    danger:   "#c62828",
  },
  radii: { lg: "24px", md: "14px", sm: "8px" },
  shadow: "0 10px 30px rgba(0,0,0,.10)",
};
