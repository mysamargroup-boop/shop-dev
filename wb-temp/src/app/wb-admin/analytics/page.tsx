
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, ShoppingBag, BarChart2, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase-client';

interface ProductSale {
  name: string;
  quantity: number;
  revenue: number;
}

interface SalesOverTime {
  date: string;
  total: number;
}

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  bestSellingByQuantity: ProductSale[];
  bestSellingByRevenue: ProductSale[];
  salesOverTime: SalesOverTime[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Invoke the Supabase Edge Function
        const { data: analyticsData, error: functionError } = await supabase.functions.invoke('get-sales-analytics');
        
        if (functionError) {
          // Handle case where function itself returns an error
          throw new Error(analyticsData?.error || functionError.message);
        }

        setData(analyticsData);
      } catch (err: any) {
        console.error("Error fetching analytics:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formattedSalesData = useMemo(() => {
    if (!data?.salesOverTime) return [];
    return data.salesOverTime.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    }));
  }, [data]);
  
  const currencyFormatter = (value: number) => {
    if (typeof value !== 'number') return value;
    return `₹${value.toLocaleString()}`;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-xl font-bold">Loading Analytics...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-destructive p-4 border border-destructive/50 rounded-md"><strong>Error:</strong> Could not load analytics data. {error}</div>;
  }
  
  if (!data) {
    return <div className="text-center text-muted-foreground">No analytics data available to display.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-headline font-bold flex items-center justify-center gap-3"><BarChart2 /> Sales Analytics</h1>
        <p className="text-muted-foreground mt-2">An overview of your store's performance based on Supabase orders.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencyFormatter(data.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From all paid orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Total paid transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencyFormatter(data.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Average revenue per order</p>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Sales Over Time (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formattedSalesData}>
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={currencyFormatter}/>
                      <Tooltip formatter={(value: number) => [currencyFormatter(value), 'Revenue']}/>
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" name="Sales Revenue" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                  </LineChart>
              </ResponsiveContainer>
          </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Units Sold</CardTitle>
            <CardDescription>The most frequently purchased items.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.bestSellingByQuantity} layout="vertical" margin={{ left: 120 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} interval={0} />
                <Tooltip formatter={(value: number) => [value, 'Units Sold']}/>
                <Bar dataKey="quantity" fill="hsl(var(--primary))" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
            <CardDescription>The highest revenue-generating items.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.bestSellingByRevenue} layout="vertical" margin={{ left: 120 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} interval={0} />
                <Tooltip formatter={(value: number) => [currencyFormatter(value), 'Revenue']}/>
                <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--accent))" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
