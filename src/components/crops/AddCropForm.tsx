import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { cropAPI, Crop } from "@/lib/api";

const cropSchema = z.object({
  name: z.string().min(1, "Crop name is required"),
  description: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  price_per_unit: z.number().min(0.01, "Price must be greater than 0"),
  harvest_date: z.string().optional(),
  location: z.string().optional(),
});

type CropFormData = z.infer<typeof cropSchema>;

interface AddCropFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editCrop?: Crop | null;
}

export const AddCropForm = ({ open, onOpenChange, onSuccess, editCrop }: AddCropFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const isEditing = !!editCrop;

  const form = useForm<CropFormData>({
    resolver: zodResolver(cropSchema),
    defaultValues: {
      name: "",
      description: "",
      quantity: 0,
      unit: "",
      price_per_unit: 0,
      harvest_date: "",
      location: "",
    },
  });

  // Reset form when dialog opens/closes or editCrop changes
  useEffect(() => {
    if (open) {
      if (isEditing && editCrop) {
        form.reset({
          name: editCrop.name,
          description: editCrop.description || "",
          quantity: editCrop.quantity,
          unit: editCrop.unit,
          price_per_unit: editCrop.price_per_unit,
          harvest_date: editCrop.harvest_date || "",
          location: editCrop.location || "",
        });
        setImagePreview(editCrop.image_url ? `http://localhost:3001${editCrop.image_url}` : null);
      } else {
        form.reset({
          name: "",
          description: "",
          quantity: 0,
          unit: "",
          price_per_unit: 0,
          harvest_date: "",
          location: "",
        });
        setSelectedImage(null);
        setImagePreview(null);
      }
    }
  }, [open, editCrop, form, isEditing]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const removeImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    if (isEditing) {
      setImagePreview(editCrop?.image_url ? `http://localhost:3001${editCrop.image_url}` : null);
    } else {
      setImagePreview(null);
    }
  };

  const onSubmit = async (data: CropFormData) => {
    setIsLoading(true);
    try {
      // Get current user
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) {
        toast({
          title: "Authentication required",
          description: "Please log in to add a crop",
          variant: "destructive",
        });
        return;
      }

      const currentUser = JSON.parse(userStr);

      if (isEditing && editCrop) {
        // Update existing crop
        await cropAPI.update(editCrop.id, {
          name: data.name,
          description: data.description || "",
          quantity: data.quantity,
          unit: data.unit,
          pricePerUnit: data.price_per_unit,
          harvestDate: data.harvest_date || "",
          location: data.location || "",
          image: selectedImage || undefined,
        });

        toast({
          title: "Success",
          description: "Crop updated successfully!",
        });
      } else {
        // Create new crop
        await cropAPI.create({
          farmerId: currentUser.id,
          name: data.name,
          description: data.description || "",
          quantity: data.quantity,
          unit: data.unit,
          pricePerUnit: data.price_per_unit,
          harvestDate: data.harvest_date || "",
          location: data.location || "",
          image: selectedImage,
        });

        toast({
          title: "Success",
          description: "Crop added successfully!",
        });
      }

      // Reset form
      form.reset();
      setSelectedImage(null);
      setImagePreview(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving crop:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Crop' : 'Add New Crop'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details of your crop listing.'
              : 'Fill in the details to list your crop for sale.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <FormLabel>Crop Photo</FormLabel>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Crop preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload a photo of your crop
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    Choose Image
                  </Button>
                </div>
              )}
            </div>

            {/* Crop Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crop Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Tomatoes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your crop quality, variety, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="tons">Tons</SelectItem>
                        <SelectItem value="bags">Bags</SelectItem>
                        <SelectItem value="pieces">Pieces</SelectItem>
                        <SelectItem value="liters">Liters</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Price per Unit */}
            <FormField
              control={form.control}
              name="price_per_unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Unit (KES)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="80.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Harvest Date */}
            <FormField
              control={form.control}
              name="harvest_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harvest Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Nairobi, Kenya" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (isEditing ? "Updating..." : "Adding...") : (isEditing ? "Update Crop" : "Add Crop")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
