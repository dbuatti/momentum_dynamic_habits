import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
// import { ThemeProvider } from "./contexts/ThemeContext.tsx"; // Removed

createRoot(document.getElementById("root")!).render(
  // <ThemeProvider> // Removed
    <App />
  // </ThemeProvider> // Removed
);