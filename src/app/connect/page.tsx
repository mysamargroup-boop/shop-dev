
'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getSiteSettings } from '@/lib/data-async';
import { SiteSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConnectPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const fetchedSettings = await getSiteSettings();
        setSettings(fetchedSettings);
      } catch (error) {
        console.error("Failed to fetch site settings", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const whatsappMessage = `
      Hi, I'm contacting you from the Woody Business website.\n\n
      *Name:* ${name}\n
      *Email:* ${email}\n
      *Subject:* ${subject}\n\n
      *Message:*\n${message}
    `.trim();

    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_CONNECT_WHATSAPP || '919691045405'}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">Connect With Us</h1>
        <p className="mt-4 text-lg text-muted-foreground">We'd love to hear from you!</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <>
                  {settings.contact_email && (
                    <div className="flex items-center gap-4">
                      <Mail className="h-5 w-5 text-primary" />
                      <a href={`mailto:${settings.contact_email}`} className="text-muted-foreground hover:text-primary">{settings.contact_email}</a>
                    </div>
                  )}
                  {settings.contact_phone && (
                    <div className="flex items-center gap-4">
                      <Phone className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">{settings.contact_phone}</span>
                    </div>
                  )}
                  {settings.contact_address && (
                    <div className="flex items-start gap-4">
                      <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <address className="text-muted-foreground not-italic whitespace-pre-line">
                        {settings.invoice_business_name || 'Woody Business'}<br/>
                        {settings.contact_address}
                      </address>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ) : settings.contact_hours ? (
                 <div className="whitespace-pre-line text-sm">{settings.contact_hours}</div>
              ) : (
                <>
                  <div className="flex justify-between"><span>Monday - Friday:</span> <span className="font-semibold text-foreground">9:00 AM - 6:00 PM</span></div>
                  <div className="flex justify-between"><span>Saturday:</span> <span className="font-semibold text-foreground">10:00 AM - 4:00 PM</span></div>
                  <div className="flex justify-between"><span>Sunday:</span> <span className="font-semibold text-foreground">Closed</span></div>
                </>
              )}
            </CardContent>
          </Card>

        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="Your Email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Message Subject" value={subject} onChange={e => setSubject(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Your message..." rows={5} value={message} onChange={e => setMessage(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">Send Message via WhatsApp</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
