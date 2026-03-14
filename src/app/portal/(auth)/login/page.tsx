"use client";

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

import { Eye, EyeOff, User } from 'lucide-react';

function getAuthErrorMessage(error: string) {
    if (error === 'CredentialsSignin') {
        return 'Invalid credentials. Please check your email/phone and password.';
    }
    if (error === 'Configuration') {
        return 'Authentication is not configured correctly on the server. Please contact support.';
    }
    return 'Unable to sign in right now. Please try again.';
}

function getSafePortalRedirect(target: string | null) {
    if (!target || !target.startsWith('/portal/')) {
        return '/portal';
    }
    return target;
}

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isOtpLoading, setIsOtpLoading] = useState(false);
    const lastShownError = useRef<string | null>(null);
    const authError = searchParams.get('error');
    const redirectTarget = getSafePortalRedirect(searchParams.get('from'));

    useEffect(() => {
        if (status !== 'authenticated') return;
        const userRole = String((session?.user as { role?: string } | undefined)?.role || '').toLowerCase();
        const defaultRoute =
            userRole === 'admin'
                ? '/portal/admin/dashboard'
                : userRole === 'agent'
                    ? '/portal/agent/dashboard'
                    : '/portal/applicant/dashboard';
        const nextRoute = redirectTarget === '/portal' ? defaultRoute : redirectTarget;
        router.replace(nextRoute);
        router.refresh();
    }, [redirectTarget, router, session, status]);

    useEffect(() => {
        if (!authError || lastShownError.current === authError) return;
        lastShownError.current = authError;
        alert(getAuthErrorMessage(authError));
    }, [authError]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) {
            alert('Please enter your email or mobile number first.');
            return;
        }
        if (!password) {
            alert('Please enter your password.');
            return;
        }
        setIsOtpLoading(true);

        try {
            const preLoginRes = await fetch('/api/auth/pre-login', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ identifier: userId.trim() }),
            });

            if (preLoginRes.ok) {
                const preLogin = await preLoginRes.json().catch(() => ({}));
                if (preLogin?.requiresVerification && preLogin?.email) {
                    const redirectRole = String(preLogin.role || 'applicant').toLowerCase();
                    setIsOtpLoading(false);
                    alert('Your email is not verified yet. We sent a new OTP to your email.');
                    router.push(`/portal/verify-otp?id=${encodeURIComponent(preLogin.email)}&role=${encodeURIComponent(redirectRole)}`);
                    return;
                }
            } else {
                const data = await preLoginRes.json().catch(() => ({}));
                if (data?.code === 'EMAIL_SEND_FAILED') {
                    setIsOtpLoading(false);
                    alert('Unable to send verification OTP right now. Please try again.');
                    return;
                }
            }
        } catch (error) {
            console.error('Pre-login check failed', error);
        }

        const result = await signIn('credentials', {
            redirect: false,
            callbackUrl: redirectTarget,
            email: userId.trim(),
            password,
        });

        setIsOtpLoading(false);

        if (result?.error || !result?.ok) {
            alert('Invalid credentials. Please check your email/phone and password.');
            return;
        }

        if (result?.url?.includes('/api/auth/error')) {
            alert('Unable to sign in right now. Please try again.');
            return;
        }

        const nextUrl = result?.url || '/portal';
        router.replace(nextUrl);
        router.refresh();
    };



    return (
        <div className="w-full max-w-[440px] bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-gray-100 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 flex flex-col items-center sm:items-start text-center sm:text-left">
                {/* Internal Branding */}
                <div className="mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0F1B2D] rounded-xl flex items-center justify-center shadow-md">
                        <img src="/images/logo.png" alt="GGBA" className="h-[24px] w-auto brightness-0 invert" />
                    </div>
                    <span className="text-lg font-black text-[#0F1B2D] tracking-tighter leading-none uppercase">GGBA GLOBAL</span>
                </div>

                <h1 className="text-[32px] sm:text-[42px] font-bold text-[#1C2430] mb-3 tracking-tight leading-none">Welcome Back</h1>
                <p className="text-[#6B7280] text-[15px] sm:text-base">Login to manage your applications.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="Email address"
                            className="w-full h-[50px] bg-gray-100 text-[#1C2430] placeholder-gray-500 border border-transparent rounded-[8px] pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white shadow-sm transition-all font-medium"
                            required
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500">
                            <User className="w-5 h-5 opacity-80" strokeWidth={2} />
                        </div>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full h-[50px] bg-gray-100 text-[#1C2430] placeholder-gray-500 border border-transparent rounded-[8px] pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white shadow-sm transition-all font-medium"
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

                <div className="flex flex-col pt-2 gap-4">
                    <button
                        type="submit"
                        disabled={isOtpLoading}
                        className="w-full h-[48px] bg-[#C6A96A] hover:bg-[#B8954F] text-[#0F1B2D] font-semibold text-sm rounded-full transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-md hover:-translate-y-[1px] flex items-center justify-center tracking-wide"
                    >
                        {isOtpLoading ? 'SIGNING IN...' : 'SIGN IN'}
                    </button>

                    <div className="flex items-center justify-center mt-2 px-1">
                        <Link href={`/portal/register?role=${'applicant'}`} className="text-sm text-[#0F1B2D] hover:text-[#1155cc] font-medium transition-colors">
                            Don&apos;t have an account? Register
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
}

function LoginPageFallback() {
    return (
        <div className="w-full max-w-[440px] bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-gray-100 mx-auto">
            <p className="text-[#1C2430] text-sm font-medium">Loading login...</p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginPageFallback />}>
            <LoginPageContent />
        </Suspense>
    );
}
