import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "@/styles/globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stillpoint",
  description:
    "Transform AI conversation history into personalized guided meditations.",
};

// Inline script to apply saved theme before React hydrates (prevents flash)
const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('stillpoint-theme') || 'minimalist';
    document.documentElement.classList.add('theme-' + theme);
    var darkThemes = ['cosmic'];
    if (darkThemes.indexOf(theme) !== -1) {
      document.documentElement.classList.add('theme-dark');
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-surface text-ink antialiased">
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      </body>
    </html>
  );
}
