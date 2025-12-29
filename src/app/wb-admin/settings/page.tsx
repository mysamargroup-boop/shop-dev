
import { getSiteSettings } from "@/lib/actions";
import SettingsForm from "@/components/admin/SettingsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notFound } from "next/navigation";
import TestsTab from "@/components/admin/TestsTab";

export default async function SettingsPage({ searchParams }: { searchParams: { tab: string } }) {
  const settings = await getSiteSettings();
  const tab = searchParams.tab || 'general';

  const validTabs = ['general', 'invoice', 'redirects', 'banners', 'tests'];
  if (!validTabs.includes(tab)) {
      notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your site's global configuration.</p>
      </div>

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="general">General & SEO</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="redirects">Redirects</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <SettingsForm settings={settings} mode="generalOnly" />
        </TabsContent>
        <TabsContent value="invoice">
          <SettingsForm settings={settings} mode="invoiceOnly" />
        </TabsContent>
        <TabsContent value="redirects">
          <SettingsForm settings={settings} mode="redirectsOnly" />
        </TabsContent>
        <TabsContent value="banners">
          <SettingsForm settings={settings} mode="bannersOnly" />
        </TabsContent>
        <TabsContent value="tests">
          <TestsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
