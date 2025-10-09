import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sprout, LogOut, Brain, MessageSquare, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CartPanel } from "@/components/Cart/CartPanel";
import { useCart } from "@/contexts/CartContext";

interface DashboardNavProps {
  userType: "farmer" | "buyer" | "admin" | "super_admin";
  onLogout: () => void;
}

const DashboardNav = ({ userType, onLogout }: DashboardNavProps) => {
  const handleSignOut = () => {
    onLogout();
    toast.success("Signed out successfully");
  };

  const { items } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Sprout className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              AgriConnect2
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/agroplan">
              <Button variant="ghost" size="sm" className="gap-2">
                <Brain className="h-4 w-4" />
                AgroPlan AI
              </Button>
            </Link>
            <Link to="/chat">
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </Button>
            </Link>

            {/* Cart sheet trigger - only show for farmers and buyers */}
            {userType !== 'admin' && userType !== 'super_admin' && (
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button aria-label="Open cart" variant="ghost" size="sm" className="relative">
                    <ShoppingCart className="h-4 w-4" />
                    {items.length > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">
                        {items.reduce((s: number, it: any) => s + it.quantity, 0)}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0">
                  <CartPanel />
                </SheetContent>
              </Sheet>
            )}

            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNav;
