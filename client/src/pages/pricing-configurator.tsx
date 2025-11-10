import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function PricingConfiguratorPage() {
  const [, navigate] = useLocation();

  // Redirect to main pricing page since calculator is now embedded there
  useEffect(() => {
    navigate('/pricing', { replace: true });
  }, [navigate]);

  return null;
}
