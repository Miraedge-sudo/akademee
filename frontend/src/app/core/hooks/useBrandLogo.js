import { useTheme } from "./useTheme";
import akademeeLogo from "../../../assets/Logo.png";
import akademeeLogoWhite from "../../../assets/LogoWhite.png";

/**
 * Returns the brand logo matching the current theme:
 * - dark mode  → LogoWhite.png (white logo, readable on dark backgrounds)
 * - light mode → Logo.png
 */
export function useBrandLogo() {
  const { theme } = useTheme();
  return theme === "dark" ? akademeeLogoWhite : akademeeLogo;
}
