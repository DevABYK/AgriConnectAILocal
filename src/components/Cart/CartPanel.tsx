import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { ordersAPI } from '@/lib/orders';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export const CartPanel = () => {
  const { items, remove, clearForFarmer, clearAll, updateQuantity } = useCart();
  const { toast } = useToast();

  // Group items by farmer
  const byFarmer: Record<string, any[]> = {};
  items.forEach(i => {
    (byFarmer[i.farmer_id] ||= []).push(i);
  });

  const finalize = async (farmerId: string) => {
    const buyerStr = localStorage.getItem('currentUser');
    if (!buyerStr) {
      toast({ title: 'Login required', description: 'Please login as buyer to place orders' });
      return;
    }
    const buyer = JSON.parse(buyerStr);
    const itemsToSend = byFarmer[farmerId].map(i => ({ crop_id: i.crop_id, quantity: i.quantity }));
    try {
      await ordersAPI.create({ buyer_id: buyer.id, buyer_contact: buyer.phone || buyer.email || '', items: itemsToSend });
      toast({ title: 'Order placed', description: 'Order placed successfully for farmer.' });
      clearForFarmer(farmerId);
    } catch (err) {
      toast({ title: 'Order failed', description: err instanceof Error ? err.message : 'Failed to place order', variant: 'destructive' });
    }
  };

  const farmerTotal = (list: any[]) => list.reduce((s, it) => s + it.quantity * (it.price_per_unit || 0), 0);

  if (items.length === 0) return <div className="p-4 text-sm text-muted-foreground">Cart is empty</div>;

  return (
    <div className="p-4 space-y-4">
      {Object.entries(byFarmer).map(([farmerId, items]) => (
        <div key={farmerId} className="border p-3 rounded">
          <div className="flex items-center justify-between mb-2">
            <strong>Farmer: {items[0]?.farmer_name || farmerId}</strong>
            <div className="space-x-2">
              <span className="text-sm font-medium">Total: KES {farmerTotal(items)}</span>
              <Button size="sm" onClick={() => clearForFarmer(farmerId)}>Clear</Button>
              <Button size="sm" onClick={() => finalize(farmerId)}>Place Order</Button>
            </div>
          </div>
          <ul className="space-y-2">
            {items.map((it: any) => (
              <li key={it.crop_id} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-sm text-muted-foreground">KES {it.price_per_unit} per unit</div>
                </div>

                <div className="flex items-center gap-2">
                  <Input type="number" min={1} value={it.quantity} onChange={(e) => updateQuantity(it.crop_id, Number(e.target.value))} className="w-20" />
                  <div className="text-sm text-muted-foreground">KES {it.quantity * it.price_per_unit}</div>
                  <Button size="sm" variant="ghost" onClick={() => remove(it.crop_id)}>Remove</Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="flex justify-between items-center">
        <div />
        <div className="flex gap-2">
          <Button onClick={() => clearAll()}>Clear Cart</Button>
        </div>
      </div>
    </div>
  );
};
