import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, MapPin, Calendar, Package } from "lucide-react";
import { cropAPI, Crop } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CropCardProps {
  crop: Crop;
  onEdit: (crop: Crop) => void;
  onDelete: (cropId: string) => void;
}

export const CropCard = ({ crop, onEdit, onDelete }: CropCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await cropAPI.delete(crop.id);

      toast({
        title: "Success",
        description: "Crop deleted successfully!",
      });

      onDelete(crop.id);
    } catch (error) {
      console.error('Error deleting crop:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete crop",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const imageUrl = crop.image_url ? `http://localhost:3001${crop.image_url}` : null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={crop.name}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-lg truncate">{crop.name}</h3>
                  <Badge className={getStatusColor(crop.status)}>
                    {crop.status}
                  </Badge>
                </div>

                {crop.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {crop.description}
                  </p>
                )}

                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {crop.quantity} {crop.unit} • KES {crop.price_per_unit} per {crop.unit}
                  </p>

                  {crop.location && (
                    <p className="text-xs text-muted-foreground flex items-center">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{crop.location}</span>
                    </p>
                  )}

                  {crop.harvest_date && (
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                      Harvest: {new Date(crop.harvest_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(crop)}
                  className="flex-shrink-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 text-destructive hover:text-destructive"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Crop</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{crop.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
