
"use client";

import { Button } from "@/components/ui/button";
import { UserCircle, PanelLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function AdminHeader({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean, setIsSidebarOpen: (open: boolean) => void }) {
    const { user } = useAuth();
    
    return (
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-muted/40 px-6 flex-shrink-0">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8 lg:hidden" onClick={() => setIsSidebarOpen(true)}>
                <PanelLeft className="h-4 w-4" />
                <span className="sr-only">Toggle Menu</span>
                </Button>
                <h1 className="font-semibold text-lg bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Admin Console</h1>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
                <UserCircle className="h-6 w-6 text-muted-foreground" />
            </div>
        </header>
    )
}
