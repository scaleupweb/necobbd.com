"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SocialIcons, Socials } from "./SocialIcons";

interface FooterProps {
  brand: { logoLine1: string; logoLine2: string; logoUrl?: string };
  footer: { headline: string; text: string; copyright: string; email: string; phone: string; address: string; socials: Socials };
}

export function Footer({ brand, footer }: FooterProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const platformLinks = [
    { label: "Players", href: "/players" },
    { label: "Clubs", href: "/clubs" },
    { label: "Tournaments", href: "/tournaments" },
    { label: "Matches", href: "/matches" },
    { label: "Rankings", href: "/rankings" },
    { label: "Transfer Market", href: "/transfer-market" },
  ];

  const companyLinks = [
    { label: "About Us", href: "/about" },
    { label: "News", href: "/news" },
    { label: "Events", href: "/events" },
    { label: "Partners", href: "/partners" },
    { label: "Rules", href: "/rules" },
    { label: "Contact", href: "/about" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "/rules" },
    { label: "Terms of Service", href: "/rules" },
    { label: "Competition Rules", href: "/rules" },
    { label: "Disciplinary Rules", href: "/disciplinary" },
    { label: "Cookie Policy", href: "/rules" },
  ];

  return (
    <footer className="w-full bg-white border-t border-[#E5E7EB] pt-12 pb-10 text-[#111111] safe-bottom-padding">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* DESKTOP 5-COLUMN LAYOUT (Hidden on mobile) */}
        <div className="hidden md:grid md:grid-cols-12 gap-8 lg:gap-12 pb-12">
          
          {/* Column 1: Brand Info (takes 4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <Link href="/" className="inline-flex items-center space-x-3 group">
              <BrandMark brand={brand} className="w-9 h-9 rounded-xl" />
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-wider text-[#111111] leading-none">{brand.logoLine1}</span>
                <span className="text-sm font-black tracking-wider text-[#111111] leading-none mt-0.5">{brand.logoLine2}</span>
              </div>
            </Link>

            <div className="pt-1">
              <div className="text-sm font-black text-[#111111]">
                {footer.headline}
              </div>
              <p className="text-xs text-[#5F6368] font-normal mt-1">
                {footer.text}
              </p>
              <div className="mt-3 space-y-1 text-xs text-[#5F6368]">
                {footer.email && <a href={`mailto:${footer.email}`} className="block hover:text-[#111111]">{footer.email}</a>}
                {footer.phone && <a href={`tel:${footer.phone}`} className="block hover:text-[#111111]">{footer.phone}</a>}
                {footer.address && <div>{footer.address}</div>}
              </div>
            </div>
          </div>

          {/* Column 2: Platform (takes 2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-[#111111]">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-[#5F6368]">
              {platformLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-[#111111] transition-colors block">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company (takes 2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-[#111111]">
              Company
            </h4>
            <ul className="space-y-2 text-xs text-[#5F6368]">
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-[#111111] transition-colors block">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal (takes 2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-[#111111]">
              Legal
            </h4>
            <ul className="space-y-2 text-xs text-[#5F6368]">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-[#111111] transition-colors block">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Follow Us (takes 2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-[#111111]">
              Follow Us
            </h4>
            <SocialIcons socials={footer.socials} className="pt-0.5" />
          </div>

        </div>

        {/* MOBILE LAYOUT: Accordion System (Visible on mobile only) */}
        <div className="md:hidden space-y-4 pb-6">
          {/* Brand Info */}
          <div className="space-y-2.5">
            <Link href="/" className="inline-flex items-center space-x-2.5">
              <BrandMark brand={brand} className="w-8 h-8 rounded-lg" />
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-wider text-[#111111] leading-none">{brand.logoLine1}</span>
                <span className="text-xs font-black tracking-wider text-[#111111] leading-none mt-0.5">{brand.logoLine2}</span>
              </div>
            </Link>
            <div className="text-xs font-bold text-[#111111]">
              {footer.headline}
            </div>
            <p className="text-xs text-[#5F6368]">
              {footer.text}
            </p>
          </div>

          {/* Collapsible Section: Platform */}
          <div className="border-t border-[#E5E7EB] pt-2.5">
            <button
              onClick={() => toggleSection("platform")}
              className="w-full flex items-center justify-between py-2 text-xs font-bold text-[#111111] min-h-[44px]"
              aria-expanded={openSection === "platform"}
            >
              <span>Platform</span>
              <ChevronDown
                className={`w-4 h-4 text-[#5F6368] transition-transform duration-200 ${
                  openSection === "platform" ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openSection === "platform" && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-2 py-2 pl-1 text-xs text-[#5F6368]"
                >
                  {platformLinks.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="block py-1 hover:text-[#111111] transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Collapsible Section: Company */}
          <div className="border-t border-[#E5E7EB] pt-2.5">
            <button
              onClick={() => toggleSection("company")}
              className="w-full flex items-center justify-between py-2 text-xs font-bold text-[#111111] min-h-[44px]"
              aria-expanded={openSection === "company"}
            >
              <span>Company</span>
              <ChevronDown
                className={`w-4 h-4 text-[#5F6368] transition-transform duration-200 ${
                  openSection === "company" ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openSection === "company" && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-2 py-2 pl-1 text-xs text-[#5F6368]"
                >
                  {companyLinks.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="block py-1 hover:text-[#111111] transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Collapsible Section: Legal */}
          <div className="border-t border-[#E5E7EB] pt-2.5">
            <button
              onClick={() => toggleSection("legal")}
              className="w-full flex items-center justify-between py-2 text-xs font-bold text-[#111111] min-h-[44px]"
              aria-expanded={openSection === "legal"}
            >
              <span>Legal</span>
              <ChevronDown
                className={`w-4 h-4 text-[#5F6368] transition-transform duration-200 ${
                  openSection === "legal" ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openSection === "legal" && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-2 py-2 pl-1 text-xs text-[#5F6368]"
                >
                  {legalLinks.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="block py-1 hover:text-[#111111] transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Follow Us on Mobile */}
          <div className="border-t border-[#E5E7EB] pt-4">
            <div className="text-xs font-bold text-[#111111] mb-2.5">
              Follow Us
            </div>
            <SocialIcons socials={footer.socials} />
          </div>
        </div>

        {/* BOTTOM: Copyright & Slogan */}
        <div className="pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between text-xs text-[#5F6368] gap-2.5">
          <div>
            {footer.copyright.replace("{year}", String(new Date().getFullYear()))}
          </div>
          <div className="font-semibold text-[#111111]">
            More Than A Game. A Community.
          </div>
        </div>

      </div>
    </footer>
  );
}

/** Site logo from admin settings, or the default "N" mark when none is uploaded. */
function BrandMark({ brand, className }: { brand: FooterProps["brand"]; className: string }) {
  if (brand.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={brand.logoUrl} alt={brand.logoLine1} className={`${className} object-cover`} />;
  }
  return (
    <div className={`${className} bg-[#111111] flex items-center justify-center text-white`}>
      <svg className="w-1/2 h-1/2 fill-current" viewBox="0 0 24 24">
        <path d="M4 4h4.5l7 10.5V4H20v16h-4.5l-7-10.5V20H4V4z" />
      </svg>
    </div>
  );
}
