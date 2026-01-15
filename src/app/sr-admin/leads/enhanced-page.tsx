'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Users, MousePointer, MapPin, TrendingUp, Eye, Pointer } from 'lucide-react';

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

interface LeadAnalytics {
  id: string;
  session_id: string;
  ip_address: string;
  city: string;
  country: string;
  page_url: string;
  event_type: 'page_view' | 'click' | 'impression' | 'form_submit';
  element_selector?: string;
  timestamp: string;
}

export default function EnhancedLeadsPage() {
  const [analytics, setAnalytics] = useState<LeadAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/lead-analytics');
      if (!res.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await res.json().catch(() => ({}));
      setAnalytics(((data as any)?.data || []) as LeadAnalytics[]);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Analytics calculations
  const metrics = {
    totalViews: analytics.filter(a => a.event_type === 'page_view').length,
    totalClicks: analytics.filter(a => a.event_type === 'click').length,
    uniqueSessions: [...new Set(analytics.map(a => a.session_id))].length,
    topCity: getTopCity(analytics),
  };

  const locationData = getLocationData(analytics);
  const eventData = getEventData(analytics);
  const timelineData = getTimelineData(analytics);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Users /> Advanced Lead Analytics
        </h1>
        <p className="text-muted-foreground mt-2">
          Track visitor behavior, clicks, impressions, and geographic data
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalViews}</div>
            <p className="text-xs text-muted-foreground">Total page views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <Pointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalClicks}</div>
            <p className="text-xs text-muted-foreground">User interactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uniqueSessions}</div>
            <p className="text-xs text-muted-foreground">Distinct visitors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.topCity}</div>
            <p className="text-xs text-muted-foreground">Most active city</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Pie data={locationData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const },
                title: { display: true, text: 'Visitors by Location' }
              }
            }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Types</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={eventData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const },
                title: { display: true, text: 'User Interactions' }
              }
            }} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Line data={timelineData} options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' as const },
              title: { display: true, text: 'Activity Over Time' }
            }
          }} />
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Event</th>
                  <th className="text-left p-2">Page</th>
                  <th className="text-left p-2">Location</th>
                  <th className="text-left p-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {analytics.slice(0, 20).map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{new Date(item.timestamp).toLocaleTimeString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.event_type === 'page_view' ? 'bg-blue-100 text-blue-800' :
                        item.event_type === 'click' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.event_type}
                      </span>
                    </td>
                    <td className="p-2">{item.page_url}</td>
                    <td className="p-2">{item.city}, {item.country}</td>
                    <td className="p-2">{item.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getTopCity(analytics: LeadAnalytics[]): string {
  const cityCount: Record<string, number> = {};
  analytics.forEach(a => {
    cityCount[a.city] = (cityCount[a.city] || 0) + 1;
  });
  return Object.keys(cityCount).sort((a, b) => cityCount[b] - cityCount[a])[0] || 'N/A';
}

function getLocationData(analytics: LeadAnalytics[]) {
  const locationCount: Record<string, number> = {};
  analytics.forEach(a => {
    const key = `${a.city}, ${a.country}`;
    locationCount[key] = (locationCount[key] || 0) + 1;
  });

  return {
    labels: Object.keys(locationCount),
    datasets: [{
      data: Object.values(locationCount),
      backgroundColor: [
        'hsl(var(--primary))',
        'hsl(var(--accent))',
        'hsl(var(--destructive))',
        'hsl(var(--secondary))',
      ]
    }]
  };
}

function getEventData(analytics: LeadAnalytics[]) {
  const eventCount: Record<string, number> = {};
  analytics.forEach(a => {
    eventCount[a.event_type] = (eventCount[a.event_type] || 0) + 1;
  });

  return {
    labels: Object.keys(eventCount),
    datasets: [{
      label: 'Events',
      data: Object.values(eventCount),
      backgroundColor: 'hsl(var(--primary))',
    }]
  };
}

function getTimelineData(analytics: LeadAnalytics[]) {
  const hourlyData: Record<string, number> = {};
  const last24Hours = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - (23 - i));
    return hour.getHours();
  });

  last24Hours.forEach(hour => {
    hourlyData[hour] = 0;
  });

  analytics.forEach(a => {
    const hour = new Date(a.timestamp).getHours();
    if (hourlyData[hour] !== undefined) {
      hourlyData[hour] += 1;
    }
  });

  return {
    labels: last24Hours.map(h => `${h}:00`),
    datasets: [{
      label: 'Activity',
      data: last24Hours.map(h => hourlyData[h]),
      borderColor: 'hsl(var(--primary))',
      backgroundColor: 'hsla(var(--primary), 0.2)',
    }]
  };
}
