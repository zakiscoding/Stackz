import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-jet-black">
      {/* Onboarding Header */}
      <div className="flex justify-between items-center p-4 pt-12">
        <div className="w-6"></div>
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-electric-blue rounded-full"></div>
          <div className="w-2 h-2 bg-white/30 rounded-full"></div>
          <div className="w-2 h-2 bg-white/30 rounded-full"></div>
          <div className="w-2 h-2 bg-white/30 rounded-full"></div>
        </div>
        <button className="text-white/60 text-sm font-medium">Skip</button>
      </div>

      {/* Onboarding Content */}
      <div className="flex-1 flex flex-col justify-center px-6">
        {/* Hero image placeholder */}
        <div className="relative mx-auto mb-8">
          <img 
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
            alt="Fitness app interface mockup" 
            className="rounded-2xl shadow-2xl w-full max-w-sm mx-auto" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-jet-black/50 to-transparent rounded-2xl"></div>
        </div>

        <div className="text-center space-y-6">
          <h1 className="text-4xl font-black leading-tight">
            Train Smarter.<br />
            <span className="electric-blue">Eat Better.</span><br />
            Transform Faster.
          </h1>
          
          <p className="text-white/70 text-lg leading-relaxed px-4">
            AI-powered fitness and nutrition plans tailored just for you. Get ready to unlock your potential.
          </p>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="p-6 space-y-4 mobile-safe-area">
        <Button 
          onClick={() => window.location.href = "/api/login"}
          className="w-full bg-electric-blue text-jet-black font-bold py-4 px-6 rounded-2xl text-lg transition-all duration-200 active:scale-95 tap-highlight glow-effect h-auto"
        >
          Get Started
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.location.href = "/api/login"}
          className="w-full border-2 border-white/20 text-white font-semibold py-4 px-6 rounded-2xl text-lg transition-all duration-200 active:scale-95 tap-highlight h-auto"
        >
          I already have an account
        </Button>
      </div>
    </div>
  );
}
