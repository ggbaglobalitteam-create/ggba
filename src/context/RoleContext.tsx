"use client";

import React, { createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

export type Role = 'applicant' | 'agent' | 'admin' | null;

type SessionUserWithRole = {
    role?: string;
};

interface RoleContextType {
    role: Role;
    setRole: (role: Role) => void;
    isAuthenticated: boolean;
    login: (role: Role) => void;
    logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const sessionUser = session?.user as SessionUserWithRole | undefined;

    const role = sessionUser?.role
        ? String(sessionUser.role).toLowerCase() as Role
        : null;

    const isAuthenticated = status === 'authenticated';

    const setRole = (nextRole: Role) => {
        // Role is derived from session on the server; no client-side override.
        void nextRole;
    };

    const login = (newRole: Role) => {
        // Keep the previous UI flow intact (OTP -> role dashboard), but auth is now session-based.
        if (newRole) router.push(`/portal/${newRole}/dashboard`);
    };

    const logout = () => {
        void signOut({ redirect: false }).then(() => {
            router.replace('/portal/login');
            router.refresh();
        });
    };

    const value = { role, setRole, isAuthenticated, login, logout };

    return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
}
