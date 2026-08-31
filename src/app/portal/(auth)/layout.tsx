"use client";

import React from 'react';
import Link from 'next/link';
import RegistrationNotice from '@/components/layout/RegistrationNotice';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-screen w-full bg-[#FAFBFF] relative overflow-hidden flex font-sans">
            {/* Main Content Area */}
            <div className="flex w-full h-full relative z-10">
                {/* Left side - Auth Form */}
                <div className="w-full lg:w-1/2 h-full flex flex-col justify-center px-6 sm:px-12 lg:px-20 pt-4 pb-20 relative">
                    {/* Content */}
                    <div className="max-w-xl w-full mx-auto md:ml-0 lg:ml-8 xl:ml-20 relative z-10 overflow-y-auto max-h-screen py-8">
                        {children}
                    </div>

                    {/* Regulatory disclosure */}
                    <div className="absolute inset-x-0 bottom-0 z-10 px-6 sm:px-12 lg:px-20 pb-5">
                        <RegistrationNotice className="text-[#6B7280]" />
                    </div>
                </div>

                {/* Right side - Image with Branding Overlay */}
                <div className="hidden lg:block lg:w-1/2 relative bg-[#0F1B2D]">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/hero-1.jpg')" }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1B2D]/80 via-[#0F1B2D]/40 to-transparent mix-blend-multiply"></div>
                        <div className="absolute inset-0 bg-black/10"></div>

                        {/* Overlay Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-20 text-white text-center z-10">
                            <h2 className="text-5xl xl:text-6xl font-bold mb-6 tracking-tight leading-[1.1]">The Future of <br /><span className="text-[#C6A96A]">Global Mobility</span></h2>
                            <div className="w-20 h-1 bg-[#C6A96A] rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
