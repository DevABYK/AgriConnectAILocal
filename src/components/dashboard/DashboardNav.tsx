import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sprout, LogOut, Brain, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface DashboardNavProps {
  userType: "farmer" | "buyer";
  onLogout: () => void;
}

const DashboardNav = ({ userType, onLogout }: DashboardNavProps) => {
  const handleSignOut = () => {
    onLogout();
    toast.success("Signed out successfully");
  };

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
