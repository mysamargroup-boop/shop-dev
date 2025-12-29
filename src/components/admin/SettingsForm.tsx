
"use client";

import { useFormState } from "react-dom";
import { updateSiteSettings } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteSettings } from "@/lib/types";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const initialState = {
  errors: {},
};

function hexToHsl(H: string) {
  if (!H) return '';
  let r = 0, g = 0, b = 0;
  if (H.length == 4) {
    r = parseInt("0x" + H[1] + H[1]);
    g = parseInt("0x" + H[2] + H[2]);
    b = parseInt("0x" + H[3] + H[3]);
  } else if (H.length == 7) {
    r = parseInt("0x" + H[1] + H[2]);
    g = parseInt("0x" + H[3] + H[4]);
    b = parseInt("0x" + H[5] + H[6]);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  let cmin = Math.min(r,g,b),
      cmax = Math.max(r,g,b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;

  if (delta == 0) h = 0;
  else if (cmax == r) h = ((g - b) / delta) % 6;
  else if (cmax == g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
}

const SeoScoreIndicator = ({ score }: { score: number; }) => {
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;
  
  const strokeColor = score > 80 ? '#22c55e' : score > 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative h-10 w-10 flex-shrink-0">
      <svg className="transform -rotate-90" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" strokeWidth="3" stroke="hsl(var(--border))" fill="transparent" />
        <circle
          cx="20" cy="20" r="18"
          stroke={strokeColor}
          fill="transparent"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{score}</span>
    </div>
  );
};


const ColorPicker = ({ label, name, defaultValue, defaultHsl }: { label: string, name: string, defaultValue: string, defaultHsl: string }) => {
    const [color, setColor] = useState(defaultValue);

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const hex = e.target.value;
        const hsl = hexToHsl(hex);
        setColor(hsl);
    }
    
    return (
        <div className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            <div className="flex items-center gap-2">
                <Input id={name} name={name} value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. 0 0% 98%" />
                <div className="relative h-10 w-10 rounded-full border p-1">
                    <div className="w-full h-full rounded-full" style={{ backgroundColor: `hsl(${color})` }} />
                    <input type="color" onChange={handleColorChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                </div>
                 <Button type="button" variant="outline" onClick={() => setColor(defaultHsl)}>Reset</Button>
            </div>
             <p className="text-xs text-muted-foreground">Enter HSL values (e.g., "24 9.8% 10%") or use the color picker.</p>
        </div>
    )
}

export default function SettingsForm({ settings, mode = 'all' }: { settings: SiteSettings, mode?: 'all' | 'invoiceOnly' | 'bannersOnly' | 'generalOnly' | 'redirectsOnly' }) {
  const [state, formAction] = useFormState(updateSiteSettings, initialState);
  const { toast } = useToast();
  
  const [title, setTitle] = useState(settings.home_meta_title || '');
  const [description, setDescription] = useState(settings.home_meta_description || '');
  const [gtmId, setGtmId] = useState(settings.google_tag_manager_id || '');

  const [titleScore] = useMemo(() => {
    const len = title.length;
    let score = 0;
    if (len > 0 && len < 30) score = Math.round((len / 30) * 50);
    else if (len > 80) score = Math.max(20, 100 - (len - 80));
    else if (len >= 30 && len <= 80) score = 100 - Math.abs(len - 60) * 2;
    return [score];
  }, [title]);

  const [descriptionScore] = useMemo(() => {
    const len = description.length;
    let score = 0;
    if (len > 0 && len < 120) score = Math.round((len / 120) * 50);
    else if (len > 170) score = Math.max(20, 100 - (len - 170));
    else if (len >= 120) score = 100;
    return [score];
  }, [description]);

  const isGtmValid = useMemo(() => /^GTM-[A-Z0-9]{4,}$/.test(gtmId), [gtmId]);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "Success",
        description: "Settings updated successfully.",
      });
    } else if (state?.message) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast]);

  const showAll = mode === 'all';
  const showInvoice = showAll || mode === 'invoiceOnly';
  const showBanners = showAll || mode === 'bannersOnly';
  const showGeneral = showAll || mode === 'generalOnly';
  const showRedirects = showAll || mode === 'redirectsOnly';
  const showTheme = showAll || mode === 'generalOnly';


  return (
    <form action={formAction}>
      <input type="hidden" name="_mode" value={mode} />
      <div className="grid gap-6">
        
        {showGeneral && (
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Manage your core business details and contact information.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                  <Label htmlFor="invoice_business_name">Business Name</Label>
                  <Input id="invoice_business_name" name="invoice_business_name" defaultValue={settings.invoice_business_name || 'Woody Business'} placeholder="Your Business Name" />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input id="logo_url" name="logo_url" defaultValue={settings.logo_url} placeholder="https://..." />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input id="contact_email" name="contact_email" type="email" defaultValue={settings.contact_email || ''} placeholder="support@example.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input id="contact_phone" name="contact_phone" type="tel" defaultValue={settings.contact_phone || ''} placeholder="+91 98765 43210" />
              </div>
              <div className="md:col-span-2 grid gap-2">
                <Label htmlFor="contact_address">Business Address</Label>
                <Textarea id="contact_address" name="contact_address" defaultValue={settings.contact_address || ''} placeholder="123 Business Lane, Suite 100, City, State, ZIP" />
              </div>
              <div className="md:col-span-2 grid gap-2">
                <Label htmlFor="contact_hours">Business Hours</Label>
                <Textarea id="contact_hours" name="contact_hours" defaultValue={settings.contact_hours || ''} placeholder="Monday - Friday: 9am - 5pm\nSaturday: 10am - 2pm" />
              </div>
            </CardContent>
          </Card>
        )}

        {showTheme && (
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>Customize the main background colors of your website.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <ColorPicker label="Background Color" name="theme_background" defaultValue={settings.theme_background || '0 0% 98%'} defaultHsl="0 0% 98%" />
              <ColorPicker label="Muted Background Color" name="theme_muted" defaultValue={settings.theme_muted || '35 63% 90%'} defaultHsl="35 63% 90%" />
            </CardContent>
          </Card>
        )}
        
        {showGeneral && (
          <Card>
            <CardHeader>
              <CardTitle>SEO & Banners</CardTitle>
              <CardDescription>Manage global SEO, tracking scripts and promotional banners.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                  <Label htmlFor="home_meta_title">Homepage Title</Label>
                  <div className="flex items-center gap-3">
                    <Input id="home_meta_title" name="home_meta_title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Woody Business | Personalized Gifts" />
                    <SeoScoreIndicator score={titleScore} />
                  </div>
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="home_meta_description">Homepage Description</Label>
                   <div className="flex items-center gap-3">
                    <Textarea id="home_meta_description" name="home_meta_description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Exquisite Personalized Wooden Gifts..." />
                    <SeoScoreIndicator score={descriptionScore} />
                  </div>
              </div>
               <div className="grid gap-2">
                  <Label htmlFor="google_tag_manager_id">Google Tag Manager ID</Label>
                  <div className="relative">
                    <Input id="google_tag_manager_id" name="google_tag_manager_id" value={gtmId} onChange={(e) => setGtmId(e.target.value)} placeholder="GTM-XXXXXX" />
                    {gtmId && (
                        isGtmValid ? (
                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                        ) : (
                            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive" />
                        )
                    )}
                  </div>
              </div>
              <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="promo_banner_enabled" name="promo_banner_enabled" defaultChecked={settings.promo_banner_enabled} />
                    <Label htmlFor="promo_banner_enabled">Show Small Promo Banner</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                          <Label htmlFor="promo_banner_title">Promo Banner Title</Label>
                          <Input id="promo_banner_title" name="promo_banner_title" defaultValue={settings.promo_banner_title || 'Free Delivery Unlocked!'} />
                      </div>
                      <div className="grid gap-2">
                          <Label htmlFor="promo_banner_subtitle">Promo Banner Subtitle</Label>
                          <Input id="promo_banner_subtitle" name="promo_banner_subtitle" defaultValue={settings.promo_banner_subtitle || `On all orders above ₹${settings.free_shipping_threshold ?? 2999}`} />
                      </div>
                  </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showGeneral && (
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Update your social media profile links.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="social_facebook">Facebook URL</Label>
                <Input id="social_facebook" name="social_facebook" type="url" defaultValue={settings.social_facebook || ''} placeholder="https://facebook.com/..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="social_instagram">Instagram URL</Label>
                <Input id="social_instagram" name="social_instagram" type="url" defaultValue={settings.social_instagram || ''} placeholder="https://instagram.com/..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="social_youtube">YouTube URL</Label>
                <Input id="social_youtube" name="social_youtube" type="url" defaultValue={settings.social_youtube || ''} placeholder="https://youtube.com/..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="social_linkedin">LinkedIn URL</Label>
                <Input id="social_linkedin" name="social_linkedin" type="url" defaultValue={settings.social_linkedin || ''} placeholder="https://linkedin.com/..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="social_twitter">Twitter/X URL</Label>
                <Input id="social_twitter" name="social_twitter" type="url" defaultValue={settings.social_twitter || ''} placeholder="https://twitter.com/..." />
              </div>
            </CardContent>
          </Card>
        )}

        

        {showBanners && (
          <Card>
            <CardHeader>
              <CardTitle>Timer Banner</CardTitle>
              <CardDescription>Settings for the homepage promotional countdown banner.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="timer_banner_enabled" name="timer_banner_enabled" defaultChecked={settings.timer_banner_enabled} />
                <Label htmlFor="timer_banner_enabled">Show Timer Banner</Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timer_banner_title">Banner Title</Label>
                <Input id="timer_banner_title" name="timer_banner_title" defaultValue={settings.timer_banner_title || 'Sale is Live!'} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timer_banner_image_url">Banner Image URL</Label>
                <Input id="timer_banner_image_url" name="timer_banner_image_url" type="url" defaultValue={settings.timer_banner_image_url || ''} placeholder="https://..." />
              </div>
              <DateTimeField defaultValue={settings.timer_banner_end_date || ''} />
            </CardContent>
          </Card>
        )}

        {showInvoice && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice & Checkout</CardTitle>
              <CardDescription>Configure invoice details and delivery timelines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="invoice_business_name">Business Name (for Invoice)</Label>
                <Input id="invoice_business_name" name="invoice_business_name" defaultValue={settings.invoice_business_name || ''} placeholder="Woody Business" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice_business_address">Business Address (for Invoice)</Label>
                <Input id="invoice_business_address" name="invoice_business_address" defaultValue={settings.invoice_business_address || ''} placeholder="City, State" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice_logo_url">Invoice Logo URL</Label>
                <Input id="invoice_logo_url" name="invoice_logo_url" defaultValue={settings.invoice_logo_url || ''} placeholder="https://..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice_currency_symbol">Currency Symbol</Label>
                <Input id="invoice_currency_symbol" name="invoice_currency_symbol" defaultValue={settings.invoice_currency_symbol || '₹'} placeholder="₹" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice_tax_percent">GST Percent</Label>
                <Input id="invoice_tax_percent" name="invoice_tax_percent" type="number" step="0.01" defaultValue={settings.invoice_tax_percent ?? 18} placeholder="18" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice_gst_number">GSTIN (optional)</Label>
                <Input id="invoice_gst_number" name="invoice_gst_number" defaultValue={settings.invoice_gst_number || ''} placeholder="22AAAAA0000A1Z5" />
              </div>
               <div className="grid gap-2">
                  <Label htmlFor="free_shipping_threshold">Free Shipping Threshold</Label>
                  <Input id="free_shipping_threshold" name="free_shipping_threshold" type="number" min={0} defaultValue={settings.free_shipping_threshold ?? 2999} />
                  <p className="text-xs text-muted-foreground">Minimum order value to qualify for free shipping.</p>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expected_delivery_min_days">Expected Delivery Min (days)</Label>
                  <Input id="expected_delivery_min_days" name="expected_delivery_min_days" type="number" min={1} defaultValue={settings.expected_delivery_min_days ?? 7} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expected_delivery_max_days">Expected Delivery Max (days)</Label>
                  <Input id="expected_delivery_max_days" name="expected_delivery_max_days" type="number" min={1} defaultValue={settings.expected_delivery_max_days ?? 15} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {showRedirects && (
          <Card>
            <CardHeader>
              <CardTitle>Redirects</CardTitle>
              <CardDescription>
                Manage URL redirects. Enter one redirect per line in the format: 
                <code className="bg-muted text-foreground p-1 rounded-sm mx-1">/source-path /destination-url</code>.
                The destination can be a relative path or a full URL.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                name="redirects"
                defaultValue={settings.redirects || ''}
                rows={10}
                placeholder="/old-product-link /collections/new-category/new-product
/another-old-page https://external-site.com"
              />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit">Save Settings</Button>
        </div>
      </div>
    </form>
  );
}

function formatDateTimeLocal(date: Date, hour: number, minute: number) {
  const d = new Date(date);
  d.setHours(hour);
  d.setMinutes(minute);
  d.setSeconds(0);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function DateTimeField({ defaultValue }: { defaultValue: string }) {
  const initial = (() => {
    try {
      return defaultValue ? new Date(defaultValue) : new Date();
    } catch {
      return new Date();
    }
  })();
  const [date, setDate] = useState<Date>(initial);
  const [hour, setHour] = useState<number>(initial.getHours());
  const [minute, setMinute] = useState<number>(initial.getMinutes());
  const display = `${date.toLocaleDateString()} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return (
    <div className="grid gap-2">
      <Label>Timer End Date</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between">
            {display}
            <span className="ml-2 text-muted-foreground">Change</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            <Calendar
              selected={date}
              onSelect={(d: Date | undefined) => d && setDate(d)}
            />
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label>Hour</Label>
                <Select value={String(hour)} onValueChange={(v) => setHour(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Minute</Label>
                <Select value={String(minute)} onValueChange={(v) => setMinute(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 60 }).map((_, i) => (
                      <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <input
        type="hidden"
        id="timer_banner_end_date"
        name="timer_banner_end_date"
        value={formatDateTimeLocal(date, hour, minute)}
        readOnly
      />
      <p className="text-xs text-muted-foreground">Pick date and time for countdown end.</p>
    </div>
  );
}
