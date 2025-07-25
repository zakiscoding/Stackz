import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PRICING_PLANS = {
  free: {
    name: "Free",
    price: 0,
    period: "forever",
    description: "Get started with basics",
    features: [
      "3 AI workout plans per month",
      "Basic meal suggestions", 
      "Progress tracking"
    ],
    priceId: null,
    buttonText: "Current Plan",
    buttonVariant: "outline" as const,
    popular: false,
    trial: undefined
  },
  premium: {
    name: "Premium",
    price: 14.99,
    period: "per month",
    description: "Everything you need to succeed",
    features: [
      "Unlimited AI workout plans",
      "Personalized meal plans",
      "Advanced analytics",
      "AI chat assistant",
      "Priority support"
    ],
    priceId: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID || "price_premium", // This would be set in environment
    buttonText: "Start Free Trial",
    buttonVariant: "default" as const,
    popular: true,
    trial: "7 days free, then $14.99/month"
  },
  elite: {
    name: "Elite", 
    price: 39.99,
    period: "per month",
    description: "Premium + personal coaching",
    features: [
      "Everything in Premium",
      "Monthly 1-on-1 Zoom coaching",
      "Custom form analysis",
      "Early access to features",
      "VIP community access"
    ],
    priceId: import.meta.env.VITE_STRIPE_ELITE_PRICE_ID || "price_elite", // This would be set in environment
    buttonText: "Upgrade to Elite",
    buttonVariant: "default" as const,
    popular: false,
    trial: "7 days free, then $39.99/month"
  }
};

function SubscribeForm({ priceId, onSuccess }: { priceId: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "?payment=success",
      },
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      onSuccess();
      toast({
        title: "Payment Successful",
        description: "Welcome to StackzFit AI Premium!",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="w-full bg-electric-blue text-jet-black font-bold py-3 px-6 rounded-xl"
      >
        {isLoading ? "Processing..." : "Subscribe"}
      </Button>
    </form>
  );
}

export default function Subscribe() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");

  const createSubscriptionMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/create-subscription", { priceId });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized", 
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handlePlanSelect = (planKey: string) => {
    const plan = PRICING_PLANS[planKey as keyof typeof PRICING_PLANS];
    if (plan.priceId) {
      setSelectedPlan(planKey);
      createSubscriptionMutation.mutate(plan.priceId);
    }
  };

  const currentTier = user?.subscriptionTier || 'free';

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jet-black">
        <div className="animate-spin w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show payment form if we have a client secret
  if (clientSecret && selectedPlan) {
    return (
      <div className="min-h-screen bg-jet-black">
        <div className="pt-12 px-4 pb-6">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              className="p-2"
              onClick={() => {
                setClientSecret("");
                setSelectedPlan(null);
              }}
            >
              <i className="fas fa-times text-white text-xl"></i>
            </Button>
            <h1 className="text-xl font-bold">Complete Payment</h1>
            <div className="w-8"></div>
          </div>
        </div>

        <div className="px-4">
          <Card className="bg-dark-gray border-white/20">
            <CardContent className="p-6">
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#00BFFF',
                      colorBackground: '#1A1A1A',
                      colorText: '#ffffff',
                      colorDanger: '#EF4444'
                    }
                  }
                }}
              >
                <SubscribeForm 
                  priceId={PRICING_PLANS[selectedPlan as keyof typeof PRICING_PLANS].priceId!}
                  onSuccess={() => {
                    setClientSecret("");
                    setSelectedPlan(null);
                  }}
                />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jet-black">
      {/* Header */}
      <div className="pt-12 px-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            className="p-2"
            onClick={() => window.history.back()}
          >
            <i className="fas fa-times text-white text-xl"></i>
          </Button>
          <h1 className="text-xl font-bold">Choose Your Plan</h1>
          <div className="w-8"></div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black mb-2">Unlock Your Full Potential</h2>
          <p className="text-white/70">Get unlimited AI-powered workouts and meal plans</p>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="px-4 space-y-4">
        {Object.entries(PRICING_PLANS).map(([key, plan]) => (
          <Card 
            key={key}
            className={`relative ${
              plan.popular 
                ? "bg-gradient-to-r from-electric-blue/20 to-electric-blue/5 border-2 border-electric-blue" 
                : key === 'elite'
                  ? "bg-gradient-to-r from-warning/20 to-warning/5 border border-warning/30"
                  : "bg-dark-gray border border-white/10"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-electric-blue text-jet-black px-4 py-1 rounded-full text-xs font-bold">
                  MOST POPULAR
                </div>
              </div>
            )}

            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`text-xl font-bold ${
                    plan.popular ? "electric-blue" : key === 'elite' ? "text-warning" : ""
                  }`}>
                    {plan.name}
                  </h3>
                  <p className="text-white/60">{plan.description}</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    plan.popular ? "electric-blue" : key === 'elite' ? "text-warning" : ""
                  }`}>
                    ${plan.price === 0 ? "0" : plan.price}
                  </div>
                  <div className="text-sm text-white/60">{plan.period}</div>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <i className={`fas fa-check text-sm ${
                      plan.popular ? "electric-blue" : key === 'elite' ? "text-warning" : "text-success"
                    }`}></i>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => handlePlanSelect(key)}
                disabled={createSubscriptionMutation.isPending || currentTier === key}
                variant={plan.buttonVariant}
                className={`w-full py-3 px-6 rounded-xl transition-all duration-200 active:scale-95 ${
                  plan.popular 
                    ? "bg-electric-blue text-jet-black font-bold glow-effect" 
                    : key === 'elite'
                      ? "bg-warning text-jet-black font-bold"
                      : currentTier === key
                        ? "border border-white/20 text-white font-semibold"
                        : ""
                }`}
              >
                {createSubscriptionMutation.isPending && selectedPlan === key 
                  ? "Setting up..." 
                  : currentTier === key 
                    ? "Current Plan"
                    : plan.buttonText
                }
              </Button>
              
              {plan.trial && (
                <p className="text-center text-xs text-white/60 mt-2">{plan.trial}</p>
              )}
            </CardContent>
          </Card>
        ))}

        <div className="text-center text-xs text-white/60 py-4">
          <p>Cancel anytime • Secure payment via Stripe</p>
          <p className="mt-1">
            <a href="#" className="electric-blue">Terms of Service</a> • 
            <a href="#" className="electric-blue ml-1">Privacy Policy</a>
          </p>
        </div>

        <div className="pb-24"></div>
      </div>
    </div>
  );
}
