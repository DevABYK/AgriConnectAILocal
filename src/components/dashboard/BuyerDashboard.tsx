import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Package, TrendingUp } from "lucide-react";
import { cropAPI, Crop } from "@/lib/api";
import { CropCard } from "@/components/crops/CropCard";

const BuyerDashboard = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 6;

  const fetchCrops = async (opts?: { q?: string; page?: number }) => {
    try {
      setIsLoading(true);
      const res = await cropAPI.getAll({ q: opts?.q || query || undefined, status: 'available', page: opts?.page || page, limit });
      // API returns { crops, total }
      setCrops(res.crops || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error("Error fetching crops for buyers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops({ page });
  }, [page]);

  const handleSearch = async () => {
    setPage(1);
    await fetchCrops({ q: query, page: 1 });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Buyer Dashboard</h1>
        <p className="text-muted-foreground">Browse fresh crops and manage your orders</p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cart Items</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Package className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">KES 0</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saved</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Browse */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Browse Available Crops</CardTitle>
          <CardDescription>Find fresh produce from local farmers</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search crops..." className="pl-10" />
            </div>
            <Button onClick={handleSearch} className="bg-gradient-to-r from-primary to-primary/80">Search</Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading crops...</p>
            </div>
          ) : crops.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No crops available at the moment</p>
              <p className="text-sm">Check back soon for fresh listings from farmers!</p>
            </div>
          ) : (
            <>
            <div className="grid gap-4">
              {crops.map((crop) => (
                <CropCard key={crop.id} crop={crop} onEdit={() => {}} onDelete={() => {}} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {page} of {Math.max(1, Math.ceil(total / limit))}</p>
              <div className="space-x-2">
                <Button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
                <Button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Your Orders</CardTitle>
          <CardDescription>Track your purchases and deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No orders yet. Start shopping to see your orders here!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyerDashboard;
