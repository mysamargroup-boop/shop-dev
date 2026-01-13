
import { getSiteSettings } from "@/lib/actions";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function BannersPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Timer Banner</h1>
        <p className="text-muted-foreground">Control the promotional countdown banner displayed on your homepage.</p>
      </div>
      <SettingsForm settings={settings} mode="bannersOnly" />
    </div>
  );
}
