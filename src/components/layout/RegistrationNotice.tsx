import type { CSSProperties } from "react";

/**
 * Regulatory disclosure shown in the footer area of every page.
 * Kept in one place so the wording stays identical site-wide.
 */
export const REGISTRATION_NOTICE =
    "LLC GGBA Global is a registered/licensed manpower agency with registration number 391 with the Ministry of Labor and Social Protection of the Republic of Belarus.";

interface RegistrationNoticeProps {
    /** Colour / alignment overrides for the surrounding surface. */
    className?: string;
    style?: CSSProperties;
}

export default function RegistrationNotice({ className = "", style }: RegistrationNoticeProps) {
    return (
        <p
            className={`italic text-xs leading-relaxed text-center mx-auto max-w-3xl text-balance ${className}`}
            style={style}
        >
            {REGISTRATION_NOTICE}
        </p>
    );
}
