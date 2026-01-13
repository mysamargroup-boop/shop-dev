
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Megaphone, DollarSign, MousePointerClick, TrendingUp } from "lucide-react";
import type { Subscription } from '@/lib/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const chartOptions = (text: string) => ({
  responsive: true,
  plugins: {
    legend: { position: 'top' as const },
    title: { display: true, text },
  },
});

function getLastNDaysLabels(n: number) {
  const labels: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    labels.push(d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
  }
  return labels;
}


export default function AdsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/subscriptions', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok && Array.isArray(data.subscriptions)) {
          setSubscriptions(data.subscriptions);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const labels = useMemo(() => getLastNDaysLabels(7), []);
  const dailyCounts = useMemo(() => {
    const map: Record<string, number> = {};
    labels.forEach(l => (map[l] = 0));
    subscriptions.forEach(s => {
      const l = new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      if (map[l] !== undefined) map[l] += 1;
    });
    return labels.map(l => map[l] || 0);
  }, [subscriptions, labels]);

  const sources = useMemo(() => {
    const m: Record<string, number> = {};
    subscriptions.forEach(s => {
      const key = (s.source || 'unknown').toLowerCase();
      m[key] = (m[key] || 0) + 1;
    });
    return m;
  }, [subscriptions]);

  const lineData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'Subscriptions',
        data: dailyCounts,
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsla(var(--primary), 0.2)',
        fill: true,
      },
    ],
  }), [labels, dailyCounts]);

  const barData = useMemo(() => {
    const sLabels = Object.keys(sources);
    const sData = sLabels.map(k => sources[k]);
    return {
      labels: sLabels.length ? sLabels : ['unknown'],
      datasets: [
        {
          label: 'Leads by Source',
          data: sData.length ? sData : [subscriptions.length],
          backgroundColor: 'hsla(var(--primary), 0.7)',
          borderColor: 'hsl(var(--primary))',
          borderWidth: 1,
        },
      ],
    };
  }, [sources, subscriptions.length]);

  const pieData = useMemo(() => {
    const sLabels = Object.keys(sources);
    const sData = sLabels.map(k => sources[k]);
    const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', 'hsl(var(--secondary))'];
    return {
      labels: sLabels.length ? sLabels : ['unknown'],
      datasets: [{
        data: sData.length ? sData : [subscriptions.length],
        backgroundColor: colors.slice(0, sLabels.length || 1),
        hoverOffset: 4,
      }]
    };
  }, [sources, subscriptions.length]);

  return (
    <div className="space-y-8">
        <div className="text-center">
            <h1 className="text-3xl font-headline font-bold flex items-center justify-center gap-3"><Megaphone /> Ads Dashboard</h1>
            <p className="text-muted-foreground mt-2">Monitor and analyze your lead performance.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{subscriptions.length}</div>
                    <p className="text-xs text-muted-foreground">{loading ? 'Loading...' : 'All-time collected leads'}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
                    <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dailyCounts.reduce((a, b) => a + b, 0)}</div>
                    <p className="text-xs text-muted-foreground">Subscriptions in past week</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Source</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{Object.keys(sources).sort((a, b) => sources[b] - sources[a])[0] || 'unknown'}</div>
                    <p className="text-xs text-muted-foreground">Most frequent lead source</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Sources</CardTitle>
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{Object.keys(sources).length || 1}</div>
                    <p className="text-xs text-muted-foreground">Different lead sources tracked</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Leads Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <Line data={lineData} options={chartOptions('Subscriptions Over Time')} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Leads by Source</CardTitle>
                </CardHeader>
                <CardContent>
                    <Bar data={barData} options={chartOptions('Leads per Source')} />
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Traffic Source Overview</CardTitle>
                <CardDescription>Visual representation of where your leads originate.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                <div className="w-full max-w-sm">
                   <Pie data={pieData} options={chartOptions('Lead Sources')} />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
