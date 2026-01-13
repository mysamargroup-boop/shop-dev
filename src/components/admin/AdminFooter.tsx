"use client";

import { useEffect, useState } from "react";
import { FooterContent } from "@/components/layout/FooterContent";
import { SiteSettings } from "@/lib/types";

export default function AdminFooter() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error("Failed to load settings for footer", err));
  }, []);

  // Pass empty categories as we might not need dynamic category links in admin footer, 
  // or we can fetch them too if needed. For now, empty array avoids errors.
  return <FooterContent settings={settings || {}} allCategories={[]} />;
}
