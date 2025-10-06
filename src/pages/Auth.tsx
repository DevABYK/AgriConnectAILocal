import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const userStr = localStorage.getItem('user');
    if (userStr) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleAuthSuccess = () => {
    navigate("/dashboard");
  };

  return <AuthForm onAuthSuccess={handleAuthSuccess} />;
};

export default Auth;
