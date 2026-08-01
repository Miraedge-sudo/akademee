import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.jsx";
import { queryClient } from "./app/core/api/queryClient";
import { ThemeProvider } from "./app/core/context/ThemeContext";
import { AuthProvider } from "./app/core/context/AuthContext";
import { YearProvider } from "./app/core/context/YearContext";
import { OfflineProvider } from "./app/core/offline/OfflineContext";
import "./app/core/i18n/i18n";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <YearProvider>
            <OfflineProvider>
              <App />
            </OfflineProvider>
          </YearProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
