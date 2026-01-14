
import { getCoupons } from "@/lib/actions";
import CouponsForm from "@/components/admin/CouponsForm";

export default async function CouponsPage() {
  const coupons = await getCoupons();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
        <p className="text-muted-foreground">Manage discount codes and promotions for your store.</p>
      </div>
      <CouponsForm coupons={coupons} />
    </div>
  );
}
