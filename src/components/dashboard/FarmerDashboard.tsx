import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Package, DollarSign } from "lucide-react";
import { cropAPI, Crop } from "@/lib/api";
import { AddCropForm } from "@/components/crops/AddCropForm";
import { CropCard } from "@/components/crops/CropCard";

const FarmerDashboard = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isAddCropOpen, setIsAddCropOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCrops = async () => {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) {
        setIsLoading(false);
        return;
      }

      const currentUser = JSON.parse(userStr);
      const userCrops = await cropAPI.getAll(currentUser.id);
      setCrops(userCrops);
    } catch (error) {
      console.error('Error fetching crops:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const handleCropAdded = () => {
    fetchCrops(); // Refresh the crops list
    setEditingCrop(null);
  };

  const handleEditCrop = (crop: Crop) => {
    setEditingCrop(crop);
    setIsAddCropOpen(true);
  };

  const handleDeleteCrop = (cropId: string) => {
    setCrops(prev => prev.filter(crop => crop.id !== cropId));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Farmer Dashboard</h1>
        <p className="text-muted-foreground">Manage your crops, view market prices, and track orders</p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Listings</p>
                <p className="text-2xl font-bold">{crops.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
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
              <TrendingUp className="h-8 w-8 text-secondary" />
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
              <DollarSign className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Crop Listings</CardTitle>
                <CardDescription>Manage your available crops</CardDescription>
              </div>
              <Button
                className="bg-gradient-to-r from-primary to-primary/80"
                onClick={() => {
                  setEditingCrop(null);
                  setIsAddCropOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Crop
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading crops...</p>
              </div>
            ) : crops.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No crops listed yet. Add your first crop to get started!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {crops.map((crop) => (
                  <CropCard
                    key={crop.id}
                    crop={crop}
                    onEdit={handleEditCrop}
                    onDelete={handleDeleteCrop}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Prices</CardTitle>
            <CardDescription>Real-time prices in your area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Tomatoes</p>
                  <p className="text-sm text-muted-foreground">Per kg</p>
                </div>
                <p className="text-lg font-bold text-primary">KES 80-120</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Maize</p>
                  <p className="text-sm text-muted-foreground">Per bag</p>
                </div>
                <p className="text-lg font-bold text-primary">KES 3,500</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Beans</p>
                  <p className="text-sm text-muted-foreground">Per kg</p>
                </div>
                <p className="text-lg font-bold text-primary">KES 150-180</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Track your pending and completed orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No orders yet. Your orders will appear here once buyers start purchasing.</p>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Crop Modal */}
      <AddCropForm
        open={isAddCropOpen}
        onOpenChange={setIsAddCropOpen}
        onSuccess={handleCropAdded}
        editCrop={editingCrop}
      />
    </div>
  );
};

export default FarmerDashboard;
