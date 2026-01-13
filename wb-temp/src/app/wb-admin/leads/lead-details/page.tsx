
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
import { Users, Pointer, MapPin, Eye, Table as TableIcon, Trash2, Settings, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

interface AnalyticsSettings {
    autoDeleteDays: number;
    maxRecords: number;
    dataRetentionEnabled: boolean;
}

const SettingsDialog = ({ settings, onSave, onCleanup }: { settings: AnalyticsSettings, onSave: (s: Partial<AnalyticsSettings>) => void, onCleanup: (type: 'all' | 'olderThan', days: number) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [autoDeleteDays, setAutoDeleteDays] = useState(settings.autoDeleteDays);
    const [maxRecords, setMaxRecords] = useState(settings.maxRecords);
    const [dataRetentionEnabled, setDataRetentionEnabled] = useState(settings.dataRetentionEnabled);

    const handleSave = () => {
        onSave({ autoDeleteDays, maxRecords, dataRetentionEnabled });
        setIsOpen(false);
    }
    
    return (
        <>
            <Button variant="outline" onClick={() => setIsOpen(true)}><Settings className="mr-2 h-4 w-4" />Retention Settings</Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Data Retention Settings</DialogTitle>
                        <DialogDescription>Manage how analytics data is stored and cleaned up.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                         <div className="flex items-center space-x-2">
                            <Switch id="retention-enabled" checked={dataRetentionEnabled} onCheckedChange={setDataRetentionEnabled} />
                            <Label htmlFor="retention-enabled">Enable Auto-Cleanup</Label>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="autoDeleteDays">Delete records older than (days)</Label>
                            <Input id="autoDeleteDays" type="number" value={autoDeleteDays} onChange={e => setAutoDeleteDays(Number(e.target.value))} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="maxRecords">Max records to keep</Label>
                            <Input id="maxRecords" type="number" value={maxRecords} onChange={e => setMaxRecords(Number(e.target.value))} />
                        </div>
                        <div className="border-t pt-4 mt-4">
                            <h4 className="font-semibold mb-2">Manual Cleanup</h4>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button variant="destructive" onClick={() => onCleanup('olderThan', autoDeleteDays)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Older Than {autoDeleteDays} Days
                                </Button>
                                <Button variant="destructive" onClick={() => onCleanup('all', 0)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete All
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave}>Save Settings</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};


export default function EnhancedLeadsPage() {
  const [analytics, setAnalytics] = useState<LeadAnalytics[]>([]);
  const [settings, setSettings] = useState<AnalyticsSettings>({ autoDeleteDays: 30, maxRecords: 1000, dataRetentionEnabled: true });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setAnalytics(data.data || []);
      if (data.settings) {
          setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({ title: 'Error', description: 'Could not load analytics data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (newSettings: Partial<AnalyticsSettings>) => {
      try {
          const res = await fetch('/api/analytics/cleanup', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newSettings),
          });
          if (res.ok) {
              setSettings(prev => ({ ...prev, ...newSettings }));
              toast({ title: 'Success', description: 'Settings saved.' });
          } else {
              throw new Error('Failed to save');
          }
      } catch (e) {
          toast({ title: 'Error', description: 'Could not save settings.', variant: 'destructive' });
      }
  };

  const handleCleanup = async (type: 'all' | 'olderThan', days: number) => {
      if (!confirm(`Are you sure you want to delete these records? This action cannot be undone.`)) return;
      try {
          const res = await fetch('/api/analytics/cleanup', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, days }),
          });
          const result = await res.json();
          if (res.ok) {
              toast({ title: 'Success', description: `${result.deleted} records deleted.` });
              fetchAnalytics();
          } else {
              throw new Error(result.error || 'Cleanup failed');
          }
      } catch (e: any) {
          toast({ title: 'Error', description: e.message || 'Could not perform cleanup.', variant: 'destructive' });
      }
  }
  
  const handleExport = () => {
      const csvContent = "data:text/csv;charset=utf-8," 
          + ["ID", "Session ID", "IP", "City", "Country", "Page URL", "Event Type", "Element", "Timestamp"].join(",") + "\n"
          + analytics.map(e => [e.id, e.session_id, e.ip_address, e.city, e.country, e.page_url, e.event_type, `"${e.element_selector || ''}"`, e.timestamp].join(",")).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "analytics_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

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
          <Users /> Visitors
        </h1>
        <p className="text-muted-foreground mt-2">
          Track visitor behavior, clicks, impressions, and geographic data.
        </p>
         <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
            <SettingsDialog settings={settings} onSave={handleSaveSettings} onCleanup={handleCleanup} />
         </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : metrics.totalViews}</div>
            <p className="text-xs text-muted-foreground">Total page views recorded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <Pointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : metrics.totalClicks}</div>
            <p className="text-xs text-muted-foreground">User interaction events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : metrics.uniqueSessions}</div>
            <p className="text-xs text-muted-foreground">Distinct visitor sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : metrics.topCity}</div>
            <p className="text-xs text-muted-foreground">Most active city by events</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Pie data={locationData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Visitors by Location' } } }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Types</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={eventData} options={{ responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'User Interactions Breakdown' } } }} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline (Last 24 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <Line data={timelineData} options={{ responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'Events per Hour' } } }} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Session ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.slice(0, 20).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.timestamp).toLocaleTimeString()}</TableCell>
                    <TableCell>
                      <span className={cn('px-2 py-1 rounded text-xs',
                        item.event_type === 'page_view' ? 'bg-blue-100 text-blue-800' :
                        item.event_type === 'click' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      )}>
                        {item.event_type}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{item.page_url}</TableCell>
                    <TableCell>{item.city || 'Unknown'}</TableCell>
                    <TableCell className="font-mono text-xs">{item.session_id.split('_')[1]}</TableCell>
                  </TableRow>
                ))}
                 {analytics.length === 0 && !loading && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No analytics data recorded yet.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getTopCity(analytics: LeadAnalytics[]): string {
  if (analytics.length === 0) return 'N/A';
  const cityCount: Record<string, number> = {};
  analytics.forEach(a => {
    if(a.city && a.city !== 'Unknown') {
        cityCount[a.city] = (cityCount[a.city] || 0) + 1;
    }
  });
  return Object.keys(cityCount).sort((a, b) => cityCount[b] - cityCount[a])[0] || 'N/A';
}

function getLocationData(analytics: LeadAnalytics[]) {
  const locationCount: Record<string, number> = {};
  analytics.forEach(a => {
    const key = a.city && a.city !== 'Unknown' ? a.city : 'Unknown';
    locationCount[key] = (locationCount[key] || 0) + 1;
  });
  const sortedLocations = Object.entries(locationCount).sort(([,a],[,b]) => b-a).slice(0, 5);
  const labels = sortedLocations.map(([key]) => key);
  const data = sortedLocations.map(([,value]) => value);

  return {
    labels,
    datasets: [{
      data,
      backgroundColor: [
        'hsl(var(--primary))',
        'hsl(var(--accent))',
        'hsl(var(--destructive))',
        'hsl(var(--secondary))',
        'hsl(var(--muted-foreground))',
      ]
    }]
  };
}

function getEventData(analytics: LeadAnalytics[]) {
  const eventCount: Record<string, number> = { 'page_view': 0, 'click': 0, 'impression': 0, 'form_submit': 0 };
  analytics.forEach(a => {
    eventCount[a.event_type] = (eventCount[a.event_type] || 0) + 1;
  });

  return {
    labels: Object.keys(eventCount),
    datasets: [{
      label: 'Events',
      data: Object.values(eventCount),
      backgroundColor: [
          'hsl(var(--primary), 0.7)',
          'hsl(var(--accent), 0.7)',
          'hsl(var(--secondary), 0.7)',
          'hsl(var(--destructive), 0.7)',
      ]
    }]
  };
}

function getTimelineData(analytics: LeadAnalytics[]) {
  const hourlyData: Record<string, number> = {};
  const labels = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - (23 - i), 0, 0, 0);
    return hour.toISOString().slice(11, 16);
  });
  
  labels.forEach(label => {
      const h = Number(label.split(':')[0]);
      hourlyData[h] = 0;
  })

  analytics.forEach(a => {
    const eventDate = new Date(a.timestamp);
    const now = new Date();
    if (now.getTime() - eventDate.getTime() <= 24 * 60 * 60 * 1000) {
        const hour = eventDate.getHours();
        if (hourlyData[hour] !== undefined) {
          hourlyData[hour] += 1;
        }
    }
  });
  
  const chartLabels = labels.map(l => Number(l.split(':')[0]));

  return {
    labels: chartLabels.map(h => `${h}:00`),
    datasets: [{
      label: 'Activity',
      data: chartLabels.map(h => hourlyData[h] || 0),
      borderColor: 'hsl(var(--primary))',
      backgroundColor: 'hsla(var(--primary), 0.2)',
      fill: true,
      tension: 0.3
    }]
  };
}
