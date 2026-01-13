
'use client';

import { useState } from 'react';
import { Briefcase, Handshake, Mail, Phone, Send, Building, User, Pen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CareerPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    purpose: 'hiring',
    position: '',
    proposal: '',
    portfolio: '',
    message: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormState(prevState => ({ ...prevState, [name]: value }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let whatsappMessage = `
      Hi, I'm contacting you from the Woody Business career page.\n\n
      *Name:* ${formState.name}
      *Email:* ${formState.email}
      *Phone:* ${formState.phone}
      *Purpose:* ${formState.purpose.charAt(0).toUpperCase() + formState.purpose.slice(1)}\n
    `;

    if (formState.purpose === 'hiring') {
      whatsappMessage += `*Applying for:* ${formState.position}\n`;
    } else {
        whatsappMessage += `*Proposal:* ${formState.proposal}\n`
    }
    
    if (formState.portfolio) {
        whatsappMessage += `*Portfolio/Link:* ${formState.portfolio}\n`;
    }

    whatsappMessage += `\n*Message:*\n${formState.message}`;

    const encodedMessage = encodeURIComponent(whatsappMessage.trim());
    const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_CAREERS_WHATSAPP || '916261603067'}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  const openPositions = [
    "Woodworking Artisan",
    "Laser Machine Operator",
    "Graphic Designer (CorelDRAW)",
    "Packaging & Dispatch Associate",
    "Social Media Manager",
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">Join Our Team</h1>
        <p className="mt-4 text-lg text-muted-foreground">Shape the future of handcrafted gifts with us.</p>
      </header>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Application</CardTitle>
            <CardDescription>We're always looking for passionate individuals. Let us know how you'd like to contribute.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label>What is your primary interest?</Label>
                    <RadioGroup
                        name="purpose"
                        value={formState.purpose}
                        onValueChange={(value) => handleSelectChange('purpose', value)}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <Label htmlFor="hiring" className="flex-1 flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                            <RadioGroupItem value="hiring" id="hiring" />
                            <Briefcase className="h-5 w-5 text-primary" />
                            <span>Apply for a Job</span>
                        </Label>
                        <Label htmlFor="collaboration" className="flex-1 flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:bg-accent/10 has-[:checked]:border-accent">
                             <RadioGroupItem value="collaboration" id="collaboration" />
                            <Handshake className="h-5 w-5 text-accent" />
                             <span>Propose a Collaboration</span>
                        </Label>
                    </RadioGroup>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" placeholder="Priya Sharma" value={formState.name} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="priya@example.com" value={formState.email} onChange={handleInputChange} required />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" value={formState.phone} onChange={handleInputChange} />
                </div>
                
                {formState.purpose === 'hiring' && (
                    <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Select name="position" onValueChange={(value) => handleSelectChange('position', value)} required>
                             <SelectTrigger>
                                <SelectValue placeholder="Select an open position" />
                            </SelectTrigger>
                            <SelectContent>
                                {openPositions.map(pos => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
                
                {formState.purpose === 'collaboration' && (
                     <div className="space-y-2">
                        <Label htmlFor="proposal">Collaboration Proposal</Label>
                        <Textarea id="proposal" name="proposal" placeholder="Describe your collaboration idea..." value={formState.proposal} onChange={handleInputChange} required />
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio, LinkedIn, or Website URL</Label>
                    <Input id="portfolio" name="portfolio" placeholder="https://your-link.com" value={formState.portfolio} onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="message">{formState.purpose === 'hiring' ? 'Cover Letter / Message' : 'Message'}</Label>
                    <Textarea id="message" name="message" placeholder="Tell us more about yourself and why you're a good fit..." value={formState.message} onChange={handleInputChange} rows={5} required />
                </div>

                <div className="flex justify-end">
                    <Button type="submit" className="w-full sm:w-auto">
                        <Send className="mr-2 h-4 w-4" />
                        Submit via WhatsApp
                    </Button>
                </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
