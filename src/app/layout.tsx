import type { Metadata } from "next";
import Link from "next/link";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SiteShell } from "@/components/layout/SiteShell";
import { getSiteSettings } from "@/lib/settings";

const fontOutfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

const fontJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-mono",
  display: "swap",
});

// Brand, navbar and footer come from admin-editable settings, so never bake them in at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { brand } = await getSiteSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    title: {
      default: `${brand.siteName} — ${brand.tagline}`,
      template: `%s | ${brand.siteName}`,
    },
    description: brand.description,
    openGraph: {
      type: "website",
      locale: "en_US",
      title: brand.siteName,
      description: brand.description,
      siteName: brand.siteName,
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();
  const a = settings.announcement;

  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${fontOutfit.variable} ${fontJakarta.variable} ${fontMono.variable} font-sans bg-[#FFFFFF] text-[#111111] min-h-screen flex flex-col antialiased selection:bg-[#111111] selection:text-white`}
      >
        <SiteShell
          navbar={<Navbar brand={settings.brand} socials={settings.footer.socials} />}
          footer={<Footer brand={settings.brand} footer={settings.footer} />}
          bottomNav={<MobileBottomNav />}
          announcement={
            a.show && a.text ? (
              <div className="w-full bg-[#111111] text-white text-xs sm:text-sm">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
                  <span className="font-medium">{a.text}</span>
                  {a.linkLabel && a.linkHref && (
                    <Link href={a.linkHref} className="font-bold text-[#FBBF24] hover:underline">
                      {a.linkLabel} →
                    </Link>
                  )}
                </div>
              </div>
            ) : null
          }
        >
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
