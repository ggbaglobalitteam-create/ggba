"use client";

import React, { useState, useRef, Suspense } from 'react';
import { Button } from '@/components/portal/Button';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

function VerifyOtpContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id') || '';
    const displayEmail = id || 'test@example.com';
    const router = useRouter();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) return; // Prevent pasting multiple chars in one via simple change

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-advance
        if (value !== '' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Allow pasting a full code
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pastedData) return;

        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);
        // Focus the next empty input or the last one
        const nextEmptyIndex = pastedData.length < 6 ? pastedData.length : 5;
        inputRefs.current[nextEmptyIndex]?.focus();
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const code = otp.join('');
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email: displayEmail, otp: code }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || 'Verification failed');
            }

            setIsLoading(false);
            router.push(`/portal/login`);
        } catch (err) {
            console.error(err);
            setIsLoading(false);
            alert('Invalid or expired code. Please try again.');
        }
    };

    const handleResend = async () => {
        if (!displayEmail || displayEmail === 'test@example.com') {
            alert('Missing email address for resend.');
            return;
        }

        setIsResending(true);
        try {
            const res = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email: displayEmail }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || 'Failed to resend OTP');
            }

            alert('A new verification code has been sent to your email.');
        } catch (error) {
            console.error(error);
            alert('Could not resend code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="w-full max-w-[480px] bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-gray-100 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-12 text-center sm:text-left">
                {/* Internal Branding */}
                <div className="mb-10 flex items-center justify-center sm:justify-start gap-3">
                    <div className="w-10 h-10 bg-[#0F1B2D] rounded-xl flex items-center justify-center shadow-md">
                        <img src="/images/logo.png" alt="GGBA" className="h-[24px] w-auto brightness-0 invert" />
                    </div>
                    <span className="text-lg font-black text-[#0F1B2D] tracking-tighter leading-none uppercase">GGBA GLOBAL</span>
                </div>

                <div className="w-16 h-16 bg-[#0F1B2D] rounded-2xl flex items-center justify-center mb-8 shadow-md mx-auto sm:mx-0">
                    <svg className="w-8 h-8 text-[#C6A96A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#1C2430] mb-3 tracking-tight">Verify Identity</h1>
                <p className="text-[#6B7280] text-[15px] sm:text-base">Enter the code sent to <span className="text-[#1C2430] font-semibold">{displayEmail}</span>.</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-8">
                <div className="flex justify-between gap-2 sm:gap-4 max-w-sm mx-auto">
                    {otp.map((digit, idx) => (
                        <input
                            key={idx}
                            ref={el => { inputRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            onPaste={handlePaste}
                            className="w-12 h-14 sm:w-14 sm:h-16 flex-1 text-center text-2xl font-semibold text-gray-900 bg-white border border-gray-300 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] focus:border-[#C6A96A] focus:ring-2 focus:ring-[#C6A96A]/20 transition-all outline-none"
                            required
                        />
                    ))}
                </div>

                <Button type="submit" fullWidth isLoading={isLoading} className="py-2.5 text-base shadow-sm">
                    Verify Email
                </Button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
                Didn&apos;t receive the code?{' '}
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="font-semibold text-[#C6A96A] hover:text-[#096dd9] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    Click to resend
                </button>
            </p>
        </div>
    );
}

export default function VerifyOtpPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
            <VerifyOtpContent />
        </Suspense>
    );
}
