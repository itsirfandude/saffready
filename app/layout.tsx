import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { PreferencesProvider } from "@/components/PreferencesProvider";
import { THEME_COLORS } from "@/src/lib/theme";

const inter = localFont({
  src: "../public/fonts/inter-latin.woff2",
  variable: "--font-ui",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: true,
});

const notoSansTamil = localFont({
  src: "../public/fonts/noto-sans-tamil-tamil.woff2",
  variable: "--font-tamil",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: true,
});

const amiri = localFont({
  src: "../public/fonts/amiri-arabic.woff2",
  variable: "--font-arabic",
  weight: "400",
  style: "normal",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = { title: "SaffReady · Find your next Jamaat.", description: "Find your next Jamaat across Coimbatore masjids.", manifest: "/manifest.webmanifest", icons: { apple: "/apple-touch-icon.png" }, appleWebApp: { capable: true, statusBarStyle: "default", title: "SaffReady" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#050505" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const themeScript = `(() => { try { const saved = localStorage.getItem('masjid-theme'); const language = localStorage.getItem('saffready-language'); const system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'classic'; const theme = saved || system; document.documentElement.dataset.theme = theme; document.documentElement.lang = language || 'ta'; const colors = ${JSON.stringify(THEME_COLORS)}; let colorMeta = document.querySelector('meta[name="theme-color"]'); if (!colorMeta) { colorMeta = document.createElement('meta'); colorMeta.setAttribute('name', 'theme-color'); document.head.appendChild(colorMeta); } colorMeta.setAttribute('content', colors[theme] || colors.classic); const dark = ['dark', 'night-blue', 'emerald', 'contrast'].includes(theme); let statusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]'); if (!statusMeta) { statusMeta = document.createElement('meta'); statusMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style'); document.head.appendChild(statusMeta); } statusMeta.setAttribute('content', dark ? 'black-translucent' : 'default'); } catch (_) {} })()`;
  return <html lang="ta" suppressHydrationWarning><head><Script id="theme-initialization" strategy="beforeInteractive">{themeScript}</Script></head><body className={`${inter.variable} ${notoSansTamil.variable} ${amiri.variable}`}><PreferencesProvider>{children}</PreferencesProvider></body></html>;
}
