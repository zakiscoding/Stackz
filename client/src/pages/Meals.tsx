import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/BottomNavigation";

export default function Meals() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: activeMeal, isLoading } = useQuery({
    queryKey: ["/api/meals/active"],
    enabled: isAuthenticated,
  });

  const { data: mealLogs } = useQuery({
    queryKey: ["/api/meals/logs"],
    enabled: isAuthenticated,
  });

  const logMealMutation = useMutation({
    mutationFn: async (mealData: { mealType: string; mealData: any }) => {
      return apiRequest("POST", "/api/meals/log", mealData);
    },
    onSuccess: () => {
      toast({
        title: "Meal Logged!",
        description: "Great job staying on track with your nutrition!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to log meal. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jet-black">
        <div className="animate-spin w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!activeMeal) {
    return (
      <div className="min-h-screen bg-jet-black pb-20">
        <div className="pt-12 px-4">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" className="p-2">
              <i className="fas fa-arrow-left text-white text-xl"></i>
            </Button>
            <h1 className="text-xl font-bold">Meals</h1>
            <div className="w-10"></div>
          </div>

          <div className="text-center py-12">
            <i className="fas fa-utensils text-white/30 text-6xl mb-4"></i>
            <h2 className="text-2xl font-bold mb-2">No Active Meal Plan</h2>
            <p className="text-white/60 mb-6">Generate your first AI-powered meal plan to get started!</p>
            <Button 
              onClick={() => window.location.href = "/"}
              className="bg-electric-blue text-jet-black font-bold py-3 px-6 rounded-xl"
            >
              Go to Home
            </Button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const mealData = activeMeal.planData;
  const dailyMeals = mealData.dailyMeals || [];

  const handleLogMeal = (mealType: string, meal: any) => {
    logMealMutation.mutate({
      mealType,
      mealData: meal
    });
  };

  const getMealImage = (mealType: string) => {
    const images = {
      breakfast: "https://images.unsplash.com/photo-1525351484163-7529414344d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
      lunch: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
      dinner: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80",
      snack: "https://images.unsplash.com/photo-1488477181946-6428a0291777?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"
    };
    return images[mealType as keyof typeof images] || images.breakfast;
  };

  return (
    <div className="min-h-screen bg-jet-black pb-20">
      {/* Header */}
      <div className="pt-12 px-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" className="p-2">
            <i className="fas fa-arrow-left text-white text-xl"></i>
          </Button>
          <h1 className="text-xl font-bold">Today's Meals</h1>
          <Button variant="ghost" className="p-2">
            <i className="fas fa-sync electric-blue text-xl"></i>
          </Button>
        </div>

        {/* Daily Macro Summary */}
        <Card className="bg-gradient-to-r from-success/20 to-transparent border border-success/20 mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <div className="text-xl font-bold text-success">{mealData.totalCalories}</div>
                <div className="text-white/60">Calories</div>
              </div>
              <div>
                <div className="text-xl font-bold electric-blue">{mealData.totalProtein}g</div>
                <div className="text-white/60">Protein</div>
              </div>
              <div>
                <div className="text-xl font-bold text-warning">{mealData.totalCarbs}g</div>
                <div className="text-white/60">Carbs</div>
              </div>
              <div>
                <div className="text-xl font-bold text-red-400">{mealData.totalFat}g</div>
                <div className="text-white/60">Fat</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meal List */}
      <div className="px-4 space-y-4">
        {dailyMeals.map((meal, mealIndex) => {
          const isLogged = Math.random() > 0.5; // This would be determined by actual logs
          const isPending = meal.type === "dinner";

          return (
            <Card 
              key={mealIndex} 
              className={`bg-dark-gray border-none ${isPending ? "border border-electric-blue/20" : ""}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold capitalize">{meal.type}</h3>
                    <p className="text-white/60 text-sm">
                      {meal.totalCalories} cal • {meal.totalProtein}g protein
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    isLogged ? "bg-success" : isPending ? "bg-electric-blue animate-pulse" : "bg-white/30"
                  }`}></div>
                </div>

                <div className="space-y-3 mb-4">
                  {meal.items?.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center space-x-3">
                      <img 
                        src={getMealImage(meal.type)} 
                        alt={item.name} 
                        className="w-12 h-12 rounded-xl object-cover" 
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-white/60">{item.portion}</p>
                      </div>
                      <p className="text-sm font-medium">{item.calories} cal</p>
                    </div>
                  ))}
                </div>

                {isLogged ? (
                  <Button 
                    className="w-full bg-success/20 text-success font-semibold py-2 px-4 rounded-xl text-sm border border-success/20"
                    disabled
                  >
                    ✓ Logged
                  </Button>
                ) : isPending ? (
                  <Button 
                    onClick={() => handleLogMeal(meal.type, meal)}
                    disabled={logMealMutation.isPending}
                    className="w-full bg-electric-blue text-jet-black font-semibold py-2 px-4 rounded-xl text-sm transition-all duration-200 active:scale-95"
                  >
                    View Recipe
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleLogMeal(meal.type, meal)}
                    disabled={logMealMutation.isPending}
                    variant="outline"
                    className="w-full border border-white/20 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-all duration-200 active:scale-95"
                  >
                    Plan for Later
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}

        {mealData.shoppingList && (
          <Card className="bg-gradient-to-r from-electric-blue/10 to-transparent border border-electric-blue/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-electric-blue/20 p-2 rounded-xl">
                  <i className="fas fa-shopping-cart electric-blue"></i>
                </div>
                <h3 className="text-xl font-bold">Shopping List</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {mealData.shoppingList.slice(0, 8).map((item: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-electric-blue/60 rounded-full"></div>
                    <span className="text-sm text-white/80">{item}</span>
                  </div>
                ))}
              </div>
              
              {mealData.shoppingList.length > 8 && (
                <p className="text-sm text-white/60 mt-2">
                  +{mealData.shoppingList.length - 8} more items
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="pb-24"></div>
      </div>

      <BottomNavigation />
    </div>
  );
}
