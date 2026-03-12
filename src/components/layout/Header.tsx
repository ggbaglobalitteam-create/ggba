"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronDown, GraduationCap, Users } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isRegisterDropdownOpen, setIsRegisterDropdownOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (status === "authenticated") {
            setIsRegisterDropdownOpen(false);
        }
    }, [status]);

    const navLinks = [
        { name: "Home", href: "/" },
        // { name: "Visa Application Centre", href: "/pages/international-application-centre" },
        { name: "Belarus", href: "/pages/llc-ggba-global" },
        { name: "Georgia", href: "/pages/s-b-georgia-llc" },
        { name: "About us", href: "/pages/about-ggba-global" },
        { name: "Contact Us", href: "/pages/contact" },
    ];

    const isDashboardRoute = pathname?.startsWith('/portal/applicant') || pathname?.startsWith('/portal/agent') || pathname?.startsWith('/portal/admin');
    const isCertificateRoute = pathname?.startsWith('/certificate/agent');
    const userRole = String((session?.user as { role?: string } | undefined)?.role || "").toLowerCase();
    const isKnownRole = userRole === "applicant" || userRole === "agent" || userRole === "admin";
    const portalRoute = isKnownRole ? `/portal/${userRole}/dashboard` : "/portal";
    const displayName = session?.user?.name?.trim() || session?.user?.email || "User";
    const isAuthenticated = status === "authenticated";

    const handleLogout = () => {
        setIsMobileMenuOpen(false);
        void signOut({ redirect: false }).then(() => {
            router.replace("/");
            router.refresh();
        });
    };

    if (isDashboardRoute || isCertificateRoute) return null;

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-[#0F1B2D] shadow-md py-4" : "bg-[#0F1B2D] py-6 shadow-sm"
                }`}
        >
            <div className="container mx-auto px-6 max-w-[1400px] flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/logo.png" alt="GGBA Global" className="h-[40px] w-auto relative z-10" />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-8">
                    <nav className="flex items-center gap-6">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href || (pathname?.startsWith(link.href) && link.href !== '/');
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`text-sm font-semibold transition-colors hover:text-white ${isActive ? 'text-[#C6A96A]' : 'text-gray-300'}`}
                                >
                                    {link.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {isAuthenticated ? (
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-600">
                            <span className="text-sm font-semibold text-gray-200 max-w-[200px] truncate" title={displayName}>
                                {displayName}
                            </span>
                            <Link
                                href={portalRoute}
                                className="text-sm font-semibold text-gray-200 hover:text-white px-3 py-2 transition-colors"
                            >
                                Dashboard
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="text-sm font-semibold bg-[#C6A96A] text-white px-5 py-2.5 rounded-full hover:bg-[#B8954F] transition-all shadow-sm"
                            >
                                Log Out
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-600">
                            <Link href="/portal/login" className="text-sm font-semibold text-gray-300 hover:text-white px-3 py-2 transition-colors">
                                Log In
                            </Link>

                            <div className="relative">
                                <button
                                    onClick={() => setIsRegisterDropdownOpen(!isRegisterDropdownOpen)}
                                    className="text-sm font-semibold bg-[#C6A96A] text-white px-5 py-2.5 rounded-full hover:bg-[#B8954F] transition-all shadow-sm flex items-center gap-2"
                                >
                                    Register <ChevronDown className="w-4 h-4" />
                                </button>

                                {isRegisterDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        <Link
                                            href="/portal/register?role=agent"
                                            onClick={() => setIsRegisterDropdownOpen(false)}
                                            className="px-4 py-2.5 hover:bg-[#F6F8FB] flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-[#C6A96A] transition-colors"
                                        >
                                            <Users className="w-4 h-4 text-gray-400" /> Agent
                                        </Link>
                                        <Link
                                            href="/portal/register?role=applicant"
                                            onClick={() => setIsRegisterDropdownOpen(false)}
                                            className="px-4 py-2.5 hover:bg-[#F6F8FB] flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-[#C6A96A] transition-colors"
                                        >
                                            <GraduationCap className="w-4 h-4 text-gray-400" /> Applicant
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="lg:hidden p-2"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="text-white" /> : <Menu className="text-white" />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isMobileMenuOpen && (
                <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl pb-4 flex flex-col">
                    <div className="flex flex-col py-2">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href || (pathname?.startsWith(link.href) && link.href !== '/');
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`font-medium px-6 py-3 border-b border-gray-50 hover:bg-[#F6F8FB] hover:text-[#C6A96A] transition-colors ${isActive ? 'text-[#C6A96A] bg-blue-50/50' : 'text-gray-800'}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            )
                        })}
                    </div>
                    {isAuthenticated ? (
                        <div className="px-6 py-4 flex flex-col gap-3 bg-[#F6F8FB]/50 mt-2">
                            <div className="text-sm font-semibold text-gray-700">Signed in as {displayName}</div>
                            <Link href={portalRoute} onClick={() => setIsMobileMenuOpen(false)} className="text-center text-sm font-bold text-gray-800 border border-gray-300 py-3 rounded-xl hover:bg-white hover:border-gray-400 transition-all shadow-sm">
                                Go to Dashboard
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="text-center text-sm font-bold bg-[#C6A96A] text-white py-3 rounded-xl hover:bg-[#B8954F] transition-all shadow-sm"
                            >
                                Log Out
                            </button>
                        </div>
                    ) : (
                        <div className="px-6 py-4 flex flex-col gap-3 bg-[#F6F8FB]/50 mt-2">
                            <Link href="/portal/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center text-sm font-bold text-gray-800 border border-gray-300 py-3 rounded-xl hover:bg-white hover:border-gray-400 transition-all shadow-sm">
                                Log In to Portal
                            </Link>

                            <div className="flex flex-col gap-2">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 mt-2">Create Account</div>
                                <Link href="/portal/register?role=agent" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-medium bg-white text-gray-700 py-3 px-4 rounded-xl border border-gray-200 hover:border-[#C6A96A] hover:text-[#C6A96A] transition-all shadow-sm">
                                    <Users className="w-4 h-4 text-gray-400" /> Agent
                                </Link>
                                <Link href="/portal/register?role=applicant" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-medium bg-white text-gray-700 py-3 px-4 rounded-xl border border-gray-200 hover:border-[#C6A96A] hover:text-[#C6A96A] transition-all shadow-sm">
                                    <GraduationCap className="w-4 h-4 text-gray-400" /> Applicant
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
