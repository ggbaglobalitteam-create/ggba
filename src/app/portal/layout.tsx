import React from "react";
import { RoleProvider } from "@/context/RoleContext";

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleProvider>{children}</RoleProvider>
    );
}
