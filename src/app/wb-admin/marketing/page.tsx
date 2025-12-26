
'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Upload, Download, Users, Info, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { sendBulkWhatsappMessages, sendBulkSimpleWhatsappMessages } from '@/lib/actions';
import type { Subscription } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const availableTemplates = [
    {
        name: 'confirm_buisness_web',
        variableCount: 6,
        variableNames: ['Customer Name', 'Order ID', 'Product Name', 'Quantity', 'Address', 'Total Cost']
    },
    {
        name: 'promotional_offer',
        variableCount: 2,
        variableNames: ['Customer Name', 'Offer Details']
    }
];

export default function MarketingPage() {
    // State for Template Messages
    const [templatePhoneNumbers, setTemplatePhoneNumbers] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [templateVariables, setTemplateVariables] = useState<string[]>([]);
    const [isTemplateLoading, setIsTemplateLoading] = useState(false);
    
    // State for Direct Messages
    const [directPhoneNumbers, setDirectPhoneNumbers] = useState('');
    const [directMessage, setDirectMessage] = useState('');
    const [isDirectLoading, setIsDirectLoading] = useState(false);

    // Common State
    const { toast } = useToast();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/subscriptions', { cache: 'no-store' });
                const data = await res.json();
                if (res.ok && Array.isArray(data.subscriptions)) {
                    setSubscriptions(data.subscriptions);
                }
            } catch {}
        })();
    }, []);

    const handleTemplateChange = (templateName: string) => {
        setSelectedTemplate(templateName);
        const template = availableTemplates.find(t => t.name === templateName);
        setTemplateVariables(new Array(template?.variableCount || 0).fill(''));
    };

    const handleVariableChange = (index: number, value: string) => {
        const newVariables = [...templateVariables];
        newVariables[index] = value;
        setTemplateVariables(newVariables);
    };

    const handleTemplateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsTemplateLoading(true);

        try {
            const numbers = templatePhoneNumbers.split(',').map(n => n.trim()).filter(Boolean);
            if (numbers.length === 0) {
                toast({ title: "Error", description: "Please enter at least one phone number.", variant: "destructive" });
                setIsTemplateLoading(false);
                return;
            }

            const result = await sendBulkWhatsappMessages({
                phoneNumbers: numbers,
                templateName: selectedTemplate,
                variables: templateVariables
            });
            
            toast({
                title: "Campaign Sent",
                description: `${result.successCount} messages sent successfully. ${result.errorCount} failed.`,
            });

        } catch (error: any) {
             toast({ title: "Error", description: error.message || "Failed to send messages.", variant: "destructive" });
        } finally {
            setIsTemplateLoading(false);
        }
    };
    
    const handleDirectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsDirectLoading(true);

        try {
            const numbers = directPhoneNumbers.split(',').map(n => n.trim()).filter(Boolean);
            if (numbers.length === 0) {
                toast({ title: "Error", description: "Please enter at least one phone number.", variant: "destructive" });
                setIsDirectLoading(false);
                return;
            }
             if (!directMessage.trim()) {
                toast({ title: "Error", description: "Message body cannot be empty.", variant: "destructive" });
                setIsDirectLoading(false);
                return;
            }

            const result = await sendBulkSimpleWhatsappMessages({
                phoneNumbers: numbers,
                message: directMessage
            });
            
            toast({
                title: "Messages Sent",
                description: `${result.successCount} direct messages sent. ${result.errorCount} failed.`,
            });

        } catch (error: any) {
             toast({ title: "Error", description: error.message || "Failed to send messages.", variant: "destructive" });
        } finally {
            setIsDirectLoading(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            if (lines.length < 1) {
                toast({ title: "Empty File", description: "The CSV file is empty.", variant: "destructive" });
                return;
            }
            const header = lines[0].toLowerCase().split(',').map(h => h.trim());
            const phoneIdx = header.indexOf('phone');
            const nameIdx = header.indexOf('name');

            if (phoneIdx === -1) {
                 toast({ title: "Invalid Format", description: "CSV must contain a 'phone' column.", variant: "destructive" });
                 return;
            }

            const importedCustomers: Array<{name: string, phone: string}> = [];
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(s => s.trim());
                const phone = cols[phoneIdx] ? cols[phoneIdx].replace(/\D/g, '').slice(-10) : '';
                const name = nameIdx > -1 ? (cols[nameIdx] || 'Customer') : 'Customer';
                if (phone) {
                    importedCustomers.push({ name, phone: `91${phone}` });
                }
            }

            if (importedCustomers.length === 0) {
                toast({ title: "No numbers found", description: "CSV did not contain valid phone numbers.", variant: "destructive" });
                return;
            }
            const importedNumbers = importedCustomers.map(c => c.phone).join(', ');
            setTemplatePhoneNumbers(importedNumbers);
            setDirectPhoneNumbers(importedNumbers);
            toast({ title: "Imported", description: `${importedCustomers.length} customers loaded into both lists.` });
        } catch (e: any) {
            toast({ title: "Import failed", description: e?.message || 'Could not read CSV', variant: "destructive" });
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleExportClick = () => {
        const rows = [['name', 'phone', 'created_at']];
        subscriptions.forEach(s => rows.push([s.name, s.phone, s.created_at]));
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subscriptions_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Exported", description: `${subscriptions.length} rows saved.` });
    };

    const currentTemplate = availableTemplates.find(t => t.name === selectedTemplate);
    const templateRecipientCount = templatePhoneNumbers.split(',').map(n => n.trim()).filter(Boolean).length;
    const directRecipientCount = directPhoneNumbers.split(',').map(n => n.trim()).filter(Boolean).length;

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-headline font-bold">Bulk Marketing Center</h1>
                <p className="text-muted-foreground mt-2">Engage your customers with targeted WhatsApp campaigns.</p>
            </div>
            
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>WhatsApp Template Approval</AlertTitle>
                <AlertDescription>
                    All WhatsApp templates must be approved by Meta through the <strong>Meta Business Manager</strong> before they can be used for campaigns. New templates can be added to this tool upon request.
                </AlertDescription>
            </Alert>
            
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        Customer Lists
                    </CardTitle>
                    <CardDescription>Import numbers from a CSV file or export your existing subscriber list.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-3">
                        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportChange} />
                        <Button variant="outline" onClick={handleImportClick}>
                            <Upload className="mr-2 h-4 w-4" /> Import from CSV
                        </Button>
                        <Button variant="outline" onClick={handleExportClick} disabled={subscriptions.length === 0}>
                            <Download className="mr-2 h-4 w-4" /> Export to CSV
                        </Button>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2">
                        <p>{subscriptions.length} subscriptions saved from popups.</p>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="template" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="template">
                  <Send className="mr-2 h-4 w-4" /> Template Messages
                </TabsTrigger>
                <TabsTrigger value="direct">
                  <MessageSquare className="mr-2 h-4 w-4" /> Direct Messages
                </TabsTrigger>
              </TabsList>
              <TabsContent value="template">
                <Card>
                    <CardHeader>
                        <CardTitle>Send Template Message</CardTitle>
                        <CardDescription>Send an approved WhatsApp template message to a list of customers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleTemplateSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="templatePhoneNumbers">Customer Phone Numbers</Label>
                                <Textarea
                                    id="templatePhoneNumbers"
                                    placeholder="Enter 10-digit numbers, separated by commas (e.g., 9876543210, 9123456789)"
                                    value={templatePhoneNumbers}
                                    onChange={(e) => setTemplatePhoneNumbers(e.target.value)}
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="template">Message Template</Label>
                                <Select onValueChange={handleTemplateChange} value={selectedTemplate} required>
                                    <SelectTrigger id="template">
                                        <SelectValue placeholder="Select a template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTemplates.map(template => (
                                            <SelectItem key={template.name} value={template.name}>
                                                {template.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {currentTemplate && (
                                 <div className="space-y-4 pt-4 border-t">
                                    <h3 className="font-semibold">Template Variables</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Fill in the dynamic content for your message. Use {`{{variable}}`} format.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {templateVariables.map((_, index) => (
                                        <div key={index} className="space-y-2">
                                            <Label htmlFor={`var-${index + 1}`}>
                                                Variable {`{{${index + 1}}}`} ({currentTemplate.variableNames?.[index] || `Parameter ${index + 1}`})
                                            </Label>
                                            <Input
                                                id={`var-${index + 1}`}
                                                value={templateVariables[index]}
                                                onChange={(e) => handleVariableChange(index, e.target.value)}
                                                placeholder={`Value for ${currentTemplate.variableNames?.[index] || `Variable ${index + 1}`}`}
                                                required
                                            />
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isTemplateLoading || !selectedTemplate || templateRecipientCount === 0}>
                                    {isTemplateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isTemplateLoading ? 'Sending...' : `Send to ${templateRecipientCount} recipients`}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="direct">
                <Card>
                    <CardHeader>
                        <CardTitle>Send Direct Message</CardTitle>
                        <CardDescription>
                            Send a simple text message. Only works for users who have messaged you in the last 24 hours.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleDirectSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="directPhoneNumbers">Customer Phone Numbers</Label>
                                <Textarea
                                    id="directPhoneNumbers"
                                    placeholder="Enter 10-digit numbers, separated by commas"
                                    value={directPhoneNumbers}
                                    onChange={(e) => setDirectPhoneNumbers(e.target.value)}
                                    rows={3}
                                    required
                                />
                            </div>

                             <div className="space-y-2">
                                <Label htmlFor="directMessage">Message</Label>
                                <Textarea
                                    id="directMessage"
                                    placeholder="Type your message here..."
                                    value={directMessage}
                                    onChange={(e) => setDirectMessage(e.target.value)}
                                    rows={8}
                                    required
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isDirectLoading || directRecipientCount === 0 || !directMessage}>
                                    {isDirectLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isDirectLoading ? 'Sending...' : `Send to ${directRecipientCount} recipients`}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

        </div>
    );
}
