import { getHeaderLinks, getFooterLinkSections } from "@/lib/data-supabase";
import { createNavigationLink, updateNavigationLink, deleteNavigationLink } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function NavigationAdminPage() {
  const headerLinks = await getHeaderLinks();
  const footerSections = await getFooterLinkSections();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Navigation</h1>
        <p className="text-muted-foreground">Manage header and footer links.</p>
      </div>

      <Tabs defaultValue="header" className="w-full">
        <TabsList>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Header Link</CardTitle>
              <CardDescription>Links appear in the top navigation bar.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createNavigationLink} className="grid md:grid-cols-4 gap-4">
                <input type="hidden" name="area" value="header" />
                <div className="grid gap-2">
                  <Label htmlFor="href">Href</Label>
                  <Input id="href" name="href" placeholder="/shop" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="label">Label</Label>
                  <Input id="label" name="label" placeholder="All Gifts" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input id="sort_order" name="sort_order" type="number" defaultValue={headerLinks.length} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="special">Special</Label>
                  <Input id="special" name="special" placeholder="true/false" />
                </div>
                <div className="md:col-span-4 flex justify-end">
                  <Button type="submit">Add</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Header Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {headerLinks.length === 0 ? (
                <p className="text-muted-foreground">No header links found.</p>
              ) : (
                headerLinks.map((link: any, idx: number) => (
                  <form key={idx} action={updateNavigationLink.bind(null, link.id)} className="grid md:grid-cols-6 gap-4 border rounded-lg p-4">
                    <div className="grid gap-2">
                      <Label>Href</Label>
                      <Input name="href" defaultValue={link.href} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Label</Label>
                      <Input name="label" defaultValue={link.label} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Sort</Label>
                      <Input name="sort_order" type="number" defaultValue={link.sort_order ?? idx} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Special</Label>
                      <Input name="special" defaultValue={String(!!link.special)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Mega Menu</Label>
                      <Input name="is_mega_menu" defaultValue={String(!!link.isMegaMenu || !!link.is_mega_menu)} />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button type="submit" variant="outline">Save</Button>
                      <form action={deleteNavigationLink}>
                        <input type="hidden" name="id" value={link.id} />
                        <Button type="submit" variant="destructive">Delete</Button>
                      </form>
                    </div>
                  </form>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Footer Link</CardTitle>
              <CardDescription>Links grouped by section.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createNavigationLink} className="grid md:grid-cols-5 gap-4">
                <input type="hidden" name="area" value="footer" />
                <div className="grid gap-2">
                  <Label htmlFor="section">Section</Label>
                  <Input id="section" name="section" placeholder="Shop" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="href">Href</Label>
                  <Input id="href" name="href" placeholder="/collections/keychains" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="label">Label</Label>
                  <Input id="label" name="label" placeholder="Keychains" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input id="sort_order" name="sort_order" type="number" defaultValue={0} />
                </div>
                <div className="md:col-span-5 flex justify-end">
                  <Button type="submit">Add</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Footer Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {footerSections.length === 0 ? (
                <p className="text-muted-foreground">No footer links found.</p>
              ) : (
                footerSections.map((section: any, sIdx: number) => (
                  <div key={sIdx} className="space-y-3">
                    <h3 className="font-semibold">{section.title}</h3>
                    {section.links.map((link: any, idx: number) => (
                      <form key={idx} action={updateNavigationLink.bind(null, link.id)} className="grid md:grid-cols-5 gap-4 border rounded-lg p-4">
                        <div className="grid gap-2">
                          <Label>Href</Label>
                          <Input name="href" defaultValue={link.href} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Label</Label>
                          <Input name="label" defaultValue={link.label} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Section</Label>
                          <Input name="section" defaultValue={section.title} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Sort</Label>
                          <Input name="sort_order" type="number" defaultValue={idx} />
                        </div>
                        <div className="flex items-end gap-2">
                          <Button type="submit" variant="outline">Save</Button>
                          <form action={deleteNavigationLink}>
                            <input type="hidden" name="id" value={link.id} />
                            <Button type="submit" variant="destructive">Delete</Button>
                          </form>
                        </div>
                      </form>
                    ))}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
