
'use client';

import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';

function RecentlySoldWidget() {
    const [soldCount, setSoldCount] = useState<number>(0);

    useEffect(() => {
        const getInitialSoldCount = () => {
            try {
                const storedData = sessionStorage.getItem('recentlySold');
                if (storedData) {
                    const { count, timestamp } = JSON.parse(storedData);
                    const now = new Date().getTime();
                    // Reset after 1 hour
                    if (now - timestamp > 3600000) {
                        return initializeSoldCount();
                    }
                    return count;
                }
            } catch (error) {
                console.error("Could not parse sessionStorage data", error);
            }
            return initializeSoldCount();
        };

        const initializeSoldCount = () => {
            const initialCount = Math.floor(Math.random() * (25 - 10 + 1)) + 10;
            const data = { count: initialCount, timestamp: new Date().getTime() };
            try {
                sessionStorage.setItem('recentlySold', JSON.stringify(data));
            } catch (e) {
                console.error("Failed to set sessionStorage", e);
            }
            return initialCount;
        };

        setSoldCount(getInitialSoldCount());

        const interval = setInterval(() => {
            setSoldCount(prevCount => {
                const newCount = prevCount + Math.floor(Math.random() * 3) + 1;
                try {
                    const storedData = sessionStorage.getItem('recentlySold');
                    const timestamp = storedData ? JSON.parse(storedData).timestamp : new Date().getTime();
                    sessionStorage.setItem('recentlySold', JSON.stringify({ count: newCount, timestamp }));
                } catch (e) {
                    console.error("Failed to set sessionStorage", e);
                }
                return newCount;
            });
        }, 8000); // increase every 8 seconds

        return () => clearInterval(interval);

    }, []);

    if (soldCount === 0) return null;

    return (
        <div className="mt-4 rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/5 p-3">
            <div className="flex items-center justify-start gap-2 text-destructive">
                <Flame className="h-5 w-5 animate-pulse" />
                <span className="font-semibold text-base">
                    <span className="font-bold">{soldCount}</span> sold in last hour
                </span>
            </div>
        </div>
    );
}

export default RecentlySoldWidget;
