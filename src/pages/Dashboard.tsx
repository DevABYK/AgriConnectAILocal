import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/lib/api";
import FarmerDashboard from "@/components/dashboard/FarmerDashboard";
import BuyerDashboard from "@/components/dashboard/BuyerDashboard";
import DashboardNav from "@/components/dashboard/DashboardNav";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      navigate("/auth");
    } else {
      setUser(JSON.parse(userStr));
      setIsLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <DashboardNav userType={user.user_type} onLogout={handleLogout} />
      {user.user_type === "farmer" ? <FarmerDashboard /> : <BuyerDashboard />}
    </div>
  );
};

export default Dashboard;
