"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Home as HomeIcon,
  User,
  Shield,
  Trophy,
  Swords,
  Flame,
  Scale,
  Newspaper,
  Calendar,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info as InfoIcon,
  Handshake,
  Bell,
} from "lucide-react";
import { CommandSearch } from "./CommandSearch";
import { SocialIcons, Socials } from "./SocialIcons";

const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "TOURNAMENT_OFFICIAL", "SENIOR_REFEREE", "REFEREE"];

export function Navbar({
  brand,
  socials,
}: {
  brand: { logoLine1: string; logoLine2: string; logoUrl: string; tagline: string };
  socials: Socials;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Players", href: "/players" },
    { label: "Clubs", href: "/clubs" },
    { label: "Matches", href: "/matches" },
    { label: "Tournaments", href: "/tournaments" },
    { label: "Rankings", href: "/rankings" },
    { label: "Transfer Market", href: "/transfer-market" },
    { label: "News", href: "/news" },
  ];

  const drawerAllLinks = [
    { label: "Home", href: "/", icon: HomeIcon },
    { label: "Players", href: "/players", icon: User },
    { label: "Clubs", href: "/clubs", icon: Shield },
    { label: "Matches", href: "/matches", icon: Swords },
    { label: "Tournaments", href: "/tournaments", icon: Trophy },
    { label: "Rankings", href: "/rankings", icon: Flame },
    { label: "Transfer Market", href: "/transfer-market", icon: Sparkles },
    { label: "News", href: "/news", icon: Newspaper },
    { label: "Events", href: "/events", icon: Calendar },
    { label: "Referees", href: "/referees", icon: Scale },
    { label: "Partners", href: "/partners", icon: Handshake },
    { label: "About", href: "/about", icon: InfoIcon },
  ];

  const moreLinks = [
    { label: "LAN & Online Events", href: "/events" },
    { label: "Match Officials", href: "/referees" },
    { label: "Disciplinary Tribunal", href: "/disciplinary" },
    { label: "Official Rulebook", href: "/rules" },
    { label: "Activity Feed", href: "/activity" },
    { label: "Partners & Sponsors", href: "/partners" },
    { label: "About NEXA / eFCOB", href: "/about" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleOpenDrawerEvent = () => setMobileDrawerOpen(true);
    window.addEventListener("open-mobile-menu", handleOpenDrawerEvent);
    return () => window.removeEventListener("open-mobile-menu", handleOpenDrawerEvent);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    // Check local session
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.success && json.data) {
          setUser(json.data);
        }
      } catch (err) {
        // Not logged in
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E5E7EB] transition-all duration-200 ${
          scrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* LEFT: Logo & Brand Identity */}
          <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group shrink-0 min-h-[44px] min-w-[44px]">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoUrl} alt={brand.logoLine1} className="w-9 h-9 rounded-lg object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#111111] flex items-center justify-center shadow-sm group-hover:bg-zinc-800 transition-colors">
                <span className="font-black text-white text-base tracking-tighter">{brand.logoLine1.charAt(0) || "N"}</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-black tracking-tight text-[#111111] flex items-center leading-none">
                {brand.logoLine1}<span className="text-[#C79A3B] ml-0.5">.</span>
                <span className="ml-1 text-[10px] font-bold text-[#5F6368] uppercase tracking-wider">
                  {brand.logoLine2}
                </span>
              </span>
              <span className="text-[9px] text-[#5F6368] font-medium tracking-wider uppercase hidden xs:block">
                {brand.tagline}
              </span>
            </div>
          </Link>

          {/* CENTER: Desktop Navigation (Hidden below xl) */}
          <nav className="hidden xl:flex items-center space-x-1 h-full">
            {navLinks.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3.5 h-full flex items-center text-[13px] font-medium tracking-tight transition-colors ${
                    active
                      ? "text-[#111111] font-semibold after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2.5px] after:bg-[#111111]"
                      : "text-[#5F6368] hover:text-[#111111]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* More Dropdown */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                onBlur={() => setTimeout(() => setMoreDropdownOpen(false), 200)}
                className="flex items-center px-3 text-[13px] font-medium text-[#5F6368] hover:text-[#111111] transition-colors"
                aria-label="More navigation links"
              >
                More <ChevronDown className="w-3.5 h-3.5 ml-1 text-[#5F6368]" />
              </button>
              {moreDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-white border border-[#E5E7EB] shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {moreLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-2 text-xs font-medium text-[#111111] hover:bg-[#F7F8FA]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* RIGHT: Action Icons & Auth */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Search Icon Button (min 44x44 touch target) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-lg text-[#5F6368] hover:text-[#111111] hover:bg-[#F7F8FA] transition-colors min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]"
              title="Search (⌘K)"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {user && (
              <Link
                href="/notifications"
                className="relative hidden sm:flex items-center justify-center w-9 h-9 rounded-lg text-[#5F6368] hover:text-[#111111] hover:bg-[#F7F8FA] transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {user.unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                    {user.unreadNotifications > 9 ? "9+" : user.unreadNotifications}
                  </span>
                )}
              </Link>
            )}

            {/* Desktop Auth or Profile Dropdown */}
            {user ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  onBlur={() => setTimeout(() => setUserDropdownOpen(false), 200)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg border border-[#E5E7EB] hover:border-[#111111] transition-all bg-white min-h-[44px]"
                >
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt="" className="w-7 h-7 rounded object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded bg-[#111111] text-white flex items-center justify-center font-bold text-xs">
                      {user.fullName?.charAt(0) || "U"}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-[#111111] max-w-[100px] truncate">
                    {user.username}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#5F6368]" />
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-[#E5E7EB] shadow-xl py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-2 border-b border-[#E5E7EB]">
                      <div className="text-xs font-bold text-[#111111] truncate">{user.fullName}</div>
                      <div className="text-[10px] text-[#5F6368] uppercase font-mono">{user.role}</div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center px-4 py-2 text-xs font-medium text-[#111111] hover:bg-[#F7F8FA]"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 mr-2" /> My Dashboard
                    </Link>
                    {user.username && (
                      <Link
                        href={`/players/${user.username}`}
                        className="flex items-center px-4 py-2 text-xs font-medium text-[#111111] hover:bg-[#F7F8FA]"
                      >
                        <User className="w-3.5 h-3.5 mr-2" /> My Public Profile
                      </Link>
                    )}
                    {user.canManageClubId && (
                      <Link
                        href="/dashboard/my-club"
                        className="flex items-center px-4 py-2 text-xs font-medium text-[#111111] hover:bg-[#F7F8FA]"
                      >
                        <Shield className="w-3.5 h-3.5 mr-2" /> My Club Management
                      </Link>
                    )}
                    {STAFF_ROLES.includes(user.role) ? (
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2 text-xs text-amber-800 hover:bg-amber-50 font-semibold"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 mr-2 text-amber-600" /> Admin Command Center
                      </Link>
                    ) : null}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#111111] hover:bg-[#F7F8FA] transition-colors min-h-[40px] flex items-center"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#111111] text-white hover:bg-zinc-800 shadow-sm transition-all min-h-[40px] flex items-center"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Drawer Hamburger Button (min 44x44px touch target) */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="xl:hidden flex items-center justify-center w-11 h-11 rounded-lg text-[#111111] hover:bg-[#F7F8FA] border border-[#E5E7EB] min-h-[44px] min-w-[44px]"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Full-Height Animated Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            {/* Translucent Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Slide-in Drawer from Right */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300, duration: 0.35 }}
              className="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl flex flex-col justify-between overflow-y-auto safe-bottom-padding"
            >
              {/* Drawer Top Header */}
              <div>
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
                  <Link
                    href="/"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center space-x-2.5"
                  >
                    {brand.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={brand.logoUrl} alt={brand.logoLine1} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[#111111] flex items-center justify-center text-white font-black text-sm">
                        {brand.logoLine1.charAt(0) || "N"}
                      </div>
                    )}
                    <span className="font-black text-sm text-[#111111] tracking-tight">
                      {brand.logoLine1}<span className="text-[#C79A3B]">.</span>{brand.logoLine2}
                    </span>
                  </Link>

                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center justify-center w-11 h-11 rounded-lg text-[#5F6368] hover:text-[#111111] hover:bg-[#F7F8FA] min-h-[44px] min-w-[44px]"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Search Bar inside Drawer */}
                <div className="p-4 border-b border-[#E5E7EB]">
                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      setSearchOpen(true);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E5E7EB] text-[#5F6368] text-xs font-medium text-left min-h-[44px]"
                  >
                    <Search className="w-4 h-4 text-[#5F6368]" />
                    <span>Search athletes, clubs, fixtures...</span>
                  </button>
                </div>

                {/* All Navigation Links */}
                <div className="px-3 py-3 space-y-1">
                  {drawerAllLinks.map((link) => {
                    const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                    const Icon = link.icon;

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors min-h-[44px] ${
                          active
                            ? "bg-[#F3F4F6] text-[#111111] font-bold"
                            : "text-[#4B5563] hover:text-[#111111] hover:bg-[#F7F8FA]"
                        }`}
                      >
                        <Icon className={`w-4.5 h-4.5 ${active ? "text-[#111111]" : "text-[#6B7280]"}`} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Bottom Actions & Auth */}
              <div className="p-5 border-t border-[#E5E7EB] space-y-3 bg-white">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5 pb-2">
                      <div className="w-8 h-8 rounded-lg bg-[#111111] text-white flex items-center justify-center font-bold text-xs">
                        {user.fullName?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#111111] truncate">{user.fullName}</div>
                        <div className="text-[10px] text-[#5F6368] uppercase">{user.role}</div>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block w-full py-2.5 text-center text-xs font-bold bg-[#111111] text-white rounded-xl min-h-[44px] flex items-center justify-center"
                    >
                      My Dashboard
                    </Link>
                    {user.canManageClubId && (
                      <Link
                        href="/dashboard/my-club"
                        onClick={() => setMobileDrawerOpen(false)}
                        className="block w-full py-2.5 text-center text-xs font-bold bg-[#C79A3B] text-black rounded-xl min-h-[44px] flex items-center justify-center"
                      >
                        <Shield className="w-3.5 h-3.5 mr-1.5" /> My Club Management
                      </Link>
                    )}
                    {STAFF_ROLES.includes(user.role) && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileDrawerOpen(false)}
                        className="block w-full py-2.5 text-center text-xs font-bold border border-amber-300 bg-amber-50 text-amber-900 rounded-xl min-h-[44px] flex items-center justify-center"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full py-2 text-center text-xs font-semibold text-rose-600 hover:underline min-h-[44px] flex items-center justify-center"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <Link
                      href="/login"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block w-full py-2.5 text-center text-xs font-bold text-[#111111] border border-[#E5E7EB] bg-white rounded-xl hover:bg-[#F7F8FA] min-h-[44px] flex items-center justify-center transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block w-full py-2.5 text-center text-xs font-bold bg-[#111111] text-white rounded-xl hover:bg-zinc-800 shadow-sm min-h-[44px] flex items-center justify-center transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}

                {/* Follow Us social links */}
                {Object.values(socials).some(Boolean) && (
                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-[#6B7280] mb-2">Follow Us</div>
                    <SocialIcons socials={socials} />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Command Search */}
      <CommandSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
