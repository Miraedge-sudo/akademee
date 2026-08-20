import { useTheme } from "./useTheme";
import logoLight from "../../../assets/logogreenname.png";
import logoDark from "../../../assets/logowhitename.png";

/**
 * Returns the brand logo with name matching the current theme:
 * - dark mode  → logowhitename.png (white logo + "Akademee" text)
 * - light mode → logogreenname.png (green logo + "Akademee" text)
 */
export function useBrandLogo() {
  const { theme } = useTheme();
  return theme === "dark" ? logoDark : logoLight;
}
