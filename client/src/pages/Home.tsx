import { useEffect } from "react";
import { useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import BottomNavigation from "@/components/BottomNavigation";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [profileQuery, activeWorkoutQuery, activeMealQuery, progressQuery, insightsQuery] = useQueries({
    queries: [
      {
        queryKey: ["/api/profile"],
        enabled: isAuthenticated,
        retry: false,
      },
      {
        queryKey: ["/api/workouts/active"],
        enabled: isAuthenticated,
        retry: false,
      },
      {
        queryKey: ["/api/meals/active"],
        enabled: isAuthenticated,
        retry: false,
      },
      {
        queryKey: ["/api/progress/latest"],
        enabled: isAuthenticated,
        retry: false,
      },
      {
        queryKey: ["/api/insights"],
        enabled: isAuthenticated,
        retry: false,
      }
    ]
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

  // Redirect to onboarding if no profile
  useEffect(() => {
    if (isAuthenticated && profileQuery.data === null) {
      setLocation("/onboarding");
    }
  }, [isAuthenticated, profileQuery.data, setLocation]);

  const regeneratePlansMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        apiRequest("POST", "/api/workouts/generate"),
        apiRequest("POST", "/api/meals/generate")
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meals/active"] });
      toast({
        title: "Plans Regenerated!",
        description: "Your new AI-powered workout and meal plans are ready.",
      });
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
        description: "Failed to regenerate plans. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jet-black">
        <div className="animate-spin w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  const profile = profileQuery.data;
  const activeWorkout = activeWorkoutQuery.data;
  const activeMeal = activeMealQuery.data;
  const latestProgress = progressQuery.data;
  const insights = insightsQuery.data;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const userName = (user as any)?.firstName || "User";
  const currentStreak = 7; // This would be calculated from actual data
  const totalWorkouts = 12; // This would come from workout sessions
  const currentWeight = (latestProgress as any)?.weight || (profile as any)?.currentWeight || 0;

  return (
    <div className="min-h-screen bg-jet-black pb-20">
      {/* Status Bar */}
      <div className="pt-12 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-white/60 text-sm">{getGreeting()}</p>
            <h2 className="text-2xl font-bold">{userName}</h2>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <i className="fas fa-bell text-white/60 text-xl"></i>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-electric-blue rounded-full"></div>
            </div>
            <img 
              src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover" 
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-dark-gray border-none">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold electric-blue">{currentStreak}</div>
              <div className="text-xs text-white/60">Day Streak</div>
            </CardContent>
          </Card>
          <Card className="bg-dark-gray border-none">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{totalWorkouts}</div>
              <div className="text-xs text-white/60">Workouts</div>
            </CardContent>
          </Card>
          <Card className="bg-dark-gray border-none">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">{currentWeight}</div>
              <div className="text-xs text-white/60">lbs</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Cards */}
      <div className="px-4 space-y-4">
        {/* Today's Workout Card */}
        <Card className="bg-gradient-to-r from-electric-blue/20 to-electric-blue/5 border border-electric-blue/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">Today's Workout</h3>
                <p className="text-white/60">
                  {activeWorkout ? `${(activeWorkout as any).title}` : "No active workout plan"}
                </p>
              </div>
              <div className="bg-electric-blue/20 p-2 rounded-xl">
                <i className="fas fa-dumbbell electric-blue"></i>
              </div>
            </div>
            
            {activeWorkout ? (
              <>
                {/* Progress Ring */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 progress-ring" viewBox="0 0 36 36">
                        <path className="text-white/10" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                        <path className="electric-blue" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold">75%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-white/60">3 of 4 exercises</p>
                      <p className="text-sm font-semibold">15 mins left</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setLocation("/workouts")}
                    className="bg-electric-blue text-jet-black font-bold py-2 px-4 rounded-xl text-sm transition-all duration-200 active:scale-95"
                  >
                    Continue
                  </Button>
                </div>
              </>
            ) : (
              <Button 
                onClick={() => regeneratePlansMutation.mutate()}
                disabled={regeneratePlansMutation.isPending}
                className="w-full bg-electric-blue text-jet-black font-bold py-3 px-6 rounded-xl"
              >
                Generate Workout Plan
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Today's Meals Card */}
        <Card className="bg-dark-gray border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">Today's Meals</h3>
                <p className="text-white/60">
                  {activeMeal ? `${activeMeal.targetCalories} cal • ${activeMeal.targetProtein}g protein` : "No active meal plan"}
                </p>
              </div>
              <div className="bg-success/20 p-2 rounded-xl">
                <i className="fas fa-utensils text-success"></i>
              </div>
            </div>

            {activeMeal ? (
              <>
                {/* Meal Progress */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="text-sm">Breakfast</span>
                    </div>
                    <span className="text-sm text-white/60">✓ Logged</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="text-sm">Lunch</span>
                    </div>
                    <span className="text-sm text-white/60">✓ Logged</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                      <span className="text-sm">Dinner</span>
                    </div>
                    <span className="text-sm electric-blue">Plan ready</span>
                  </div>
                </div>
                <Button 
                  onClick={() => setLocation("/meals")}
                  variant="outline"
                  className="w-full border-electric-blue/30 text-electric-blue"
                >
                  View Meal Plan
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => regeneratePlansMutation.mutate()}
                disabled={regeneratePlansMutation.isPending}
                className="w-full bg-success text-white font-bold py-3 px-6 rounded-xl"
              >
                Generate Meal Plan
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Weight Progress Card */}
        <Card className="bg-dark-gray border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">Weight Progress</h3>
                <p className="text-white/60">This week: -1.2 lbs</p>
              </div>
              <div className="bg-warning/20 p-2 rounded-xl">
                <i className="fas fa-chart-line text-warning"></i>
              </div>
            </div>

            {/* Mini Chart Placeholder */}
            <div className="h-20 bg-gradient-to-r from-warning/20 to-transparent rounded-xl flex items-end justify-between p-2 mb-4">
              <div className="w-1 bg-warning/40 h-8 rounded"></div>
              <div className="w-1 bg-warning/60 h-12 rounded"></div>
              <div className="w-1 bg-warning/50 h-10 rounded"></div>
              <div className="w-1 bg-warning/70 h-14 rounded"></div>
              <div className="w-1 bg-warning h-16 rounded"></div>
              <div className="w-1 bg-warning/80 h-12 rounded"></div>
              <div className="w-1 bg-warning/90 h-18 rounded"></div>
            </div>

            <Button 
              onClick={() => setLocation("/progress")}
              variant="outline"
              className="w-full border-warning/30 text-warning"
            >
              View Progress
            </Button>
          </CardContent>
        </Card>

        {/* AI Insights */}
        {insights && (insights as any).insights && (
          <Card className="bg-gradient-to-r from-electric-blue/20 to-transparent border border-electric-blue/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-electric-blue/20 p-2 rounded-xl">
                  <i className="fas fa-magic electric-blue"></i>
                </div>
                <h3 className="text-xl font-bold">AI Insights</h3>
              </div>
              
              <div className="space-y-3">
                {(insights as any).insights.map((insight: string, index: number) => (
                  <p key={index} className="text-sm text-white/80">
                    {insight}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Regenerate Button */}
        <Button 
          onClick={() => regeneratePlansMutation.mutate()}
          disabled={regeneratePlansMutation.isPending}
          className="w-full bg-gradient-to-r from-electric-blue to-electric-blue/80 text-jet-black font-bold py-4 px-6 rounded-2xl text-lg transition-all duration-200 active:scale-95 tap-highlight flex items-center justify-center space-x-2 h-auto"
        >
          <i className="fas fa-magic"></i>
          <span>{regeneratePlansMutation.isPending ? "Regenerating..." : "Regenerate AI Plan"}</span>
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
}
