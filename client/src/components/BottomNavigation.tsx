import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { 
      path: "/", 
      icon: "fa-home", 
      label: "Home" 
    },
    { 
      path: "/workouts", 
      icon: "fa-dumbbell", 
      label: "Workouts" 
    },
    { 
      path: "/meals", 
      icon: "fa-utensils", 
      label: "Meals" 
    },
    { 
      path: "/progress", 
      icon: "fa-chart-bar", 
      label: "Progress" 
    },
    { 
      path: "/subscribe", 
      icon: "fa-user", 
      label: "Profile" 
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-gray/95 backdrop-blur-lg border-t border-white/10 mobile-safe-area">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => setLocation(item.path)}
              className="flex flex-col items-center p-2 tap-highlight hover:bg-transparent"
            >
              <i className={`fas ${item.icon} text-xl mb-1 ${
                isActive ? "electric-blue" : "text-white/60"
              }`}></i>
              <span className={`text-xs ${
                isActive ? "electric-blue font-medium" : "text-white/60"
              }`}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
