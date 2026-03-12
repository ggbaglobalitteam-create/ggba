"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

const EMAIL_EXISTS_ALERT =
    "This email address is already in use or registered. Please sign-in with your login credentials. If unable, contact support!";

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roleQuery = searchParams.get('role');
    let displayRole = 'Applicant';
    if (roleQuery?.toLowerCase() === 'agent') displayRole = 'Agent';
    else if (roleQuery?.toLowerCase() === 'applicant') displayRole = 'Applicant';

    const isAgent = displayRole === 'Agent';

    const [isLoading, setIsLoading] = useState(false);

    // Base Fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Agent Specific Fields removed for complete-profile step

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert('Password and confirm password do not match.');
            return;
        }
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    phone,
                    password,
                    role: isAgent ? 'agent' : 'applicant',
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                if (data?.code === 'EMAIL_EXISTS') {
                    alert(EMAIL_EXISTS_ALERT);
                    setIsLoading(false);
                    return;
                }

                throw new Error(data?.error || 'Registration failed. Please try again.');
            }

            setIsLoading(false);
            router.push(`/portal/verify-otp?id=${encodeURIComponent(email)}&role=${isAgent ? 'agent' : 'applicant'}`);
        } catch (error) {
            console.error(error);
            const message = error instanceof Error && error.message
                ? error.message
                : "Registration failed. Please try again.";
            alert(message);
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[540px] bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-gray-100 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 my-8">
            <div className="mb-10 flex flex-col items-center sm:items-start text-center sm:text-left">
                {/* Internal Branding */}
                <div className="mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0F1B2D] rounded-xl flex items-center justify-center shadow-md">
                        <img src="/images/logo.png" alt="GGBA" className="h-[24px] w-auto brightness-0 invert" />
                    </div>
                    <span className="text-lg font-black text-[#0F1B2D] tracking-tighter leading-none uppercase">GGBA GLOBAL</span>
                </div>

                <h1 className="text-[32px] sm:text-[42px] font-bold text-[#1C2430] mb-3 tracking-tight leading-none">Create {displayRole} Account</h1>
                <p className="text-[#6B7280] text-[15px] sm:text-base">Start your global journey today.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-1 gap-x-5 gap-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                        {/* First Name / Country */}
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-semibold text-[#1C2430] block">
                                First Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Enter Name"
                                className="w-full h-[50px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[10px] px-4 py-3 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all font-medium"
                                required
                            />
                        </div>

                        {/* Last Name / Name of Institution */}
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-semibold text-[#1C2430] block">
                                Last Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Enter Last Name"
                                className="w-full h-[50px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[10px] px-4 py-3 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all font-medium"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-semibold text-[#1C2430] block">
                                Email <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter Email"
                                className="w-full h-[50px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[10px] px-4 py-3 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all font-medium"
                                required
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-semibold text-[#1C2430] block">
                                Phone Number <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Enter Phone No"
                                className="w-full h-[50px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[10px] px-4 py-3 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all font-medium"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[13px] font-semibold text-[#1C2430] block">
                                Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a password"
                                    className="w-full h-[50px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[10px] pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all font-medium"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0F1B2D] transition-colors"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[13px] font-semibold text-[#1C2430] block">
                                Confirm Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    className="w-full h-[50px] bg-white text-[#1C2430] placeholder-gray-400 border border-[#E5EAF2] rounded-[10px] pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-[#C6A96A] focus:ring-[3px] focus:ring-[#C6A96A]/15 shadow-sm transition-all font-medium"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0F1B2D] transition-colors"
                                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Agent Specific Fields removed */}
                </div>

                <div className="flex flex-col pt-4 gap-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-[48px] bg-[#C6A96A] hover:bg-[#B8954F] text-[#0F1B2D] font-semibold text-base rounded-[10px] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-md hover:-translate-y-[1px]"
                    >
                        {isLoading ? 'Registering...' : 'Register'}
                    </button>

                    <div className="flex items-center justify-center mt-2 px-1">
                        <Link href="/portal/login" className="text-sm text-[#0F1B2D] hover:text-[#C6A96A] font-medium transition-colors">
                            Already have an account? Login
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
            <RegisterContent />
        </Suspense>
    );
}
