
'use client';

import { getSamples } from '@/lib/data-async';
import { useEffect, useState } from 'react';
import type { Sample } from '@/lib/types';
import SamplesForm from '@/components/admin/SamplesForm';

export default function SamplesAdminPage() {
    const [samples, setSamples] = useState<Sample[]>([]);

    useEffect(() => {
        const fetchSamples = async () => {
            const data = await getSamples();
            setSamples(data);
        };
        fetchSamples();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Customer Samples</h1>
                <p className="text-muted-foreground">Manage the images in the customer gallery.</p>
            </div>
            <SamplesForm samples={samples} />
        </div>
    );
}
