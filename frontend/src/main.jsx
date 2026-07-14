import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./app/core/context/ThemeContext";
import { AuthProvider } from "./app/core/context/AuthContext";
import { YearProvider } from "./app/core/context/YearContext";
import "./app/core/i18n/i18n";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <YearProvider>
          <App />
        </YearProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
