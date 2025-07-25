import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/BottomNavigation";
import { useState } from "react";

export default function Workouts() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [completedSets, setCompletedSets] = useState<{ [key: string]: boolean }>({});

  const { data: activeWorkout, isLoading } = useQuery({
    queryKey: ["/api/workouts/active"],
    enabled: isAuthenticated,
  });

  const logSetMutation = useMutation({
    mutationFn: async (setData: { exerciseName: string; setNumber: number; reps: number; weight: number }) => {
      return apiRequest("POST", "/api/workouts/sessions", {
        workoutType: "push", // This would be dynamic
        exercises: [setData],
        duration: 0,
        completedAt: new Date()
      });
    },
    onSuccess: () => {
      toast({
        title: "Set Logged!",
        description: "Great work! Keep pushing forward.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to log set. Please try again.",
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

  if (!activeWorkout) {
    return (
      <div className="min-h-screen bg-jet-black pb-20">
        <div className="pt-12 px-4">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" className="p-2">
              <i className="fas fa-arrow-left text-white text-xl"></i>
            </Button>
            <h1 className="text-xl font-bold">Workouts</h1>
            <div className="w-10"></div>
          </div>

          <div className="text-center py-12">
            <i className="fas fa-dumbbell text-white/30 text-6xl mb-4"></i>
            <h2 className="text-2xl font-bold mb-2">No Active Workout</h2>
            <p className="text-white/60 mb-6">Generate your first AI-powered workout plan to get started!</p>
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

  const workoutData = activeWorkout.planData;
  const todaysWorkout = workoutData.weeklySchedule?.[0]; // For demo, show first workout

  const handleLogSet = (exerciseName: string, setNumber: number) => {
    const setKey = `${exerciseName}-${setNumber}`;
    setCompletedSets(prev => ({ ...prev, [setKey]: true }));
    
    logSetMutation.mutate({
      exerciseName,
      setNumber,
      reps: 10, // This would be user input
      weight: 185 // This would be user input
    });
  };

  return (
    <div className="min-h-screen bg-jet-black pb-20">
      {/* Header */}
      <div className="pt-12 px-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" className="p-2">
            <i className="fas fa-arrow-left text-white text-xl"></i>
          </Button>
          <h1 className="text-xl font-bold">{todaysWorkout?.type || "Workout"}</h1>
          <Button variant="ghost" className="p-2">
            <i className="fas fa-ellipsis-v text-white/60 text-xl"></i>
          </Button>
        </div>

        {/* Workout Stats */}
        <Card className="bg-gradient-to-r from-electric-blue/20 to-transparent border border-electric-blue/20 mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold electric-blue">{todaysWorkout?.duration || 45}</div>
                <div className="text-xs text-white/60">Minutes</div>
              </div>
              <div>
                <div className="text-2xl font-bold electric-blue">{todaysWorkout?.exercises?.length || 6}</div>
                <div className="text-xs text-white/60">Exercises</div>
              </div>
              <div>
                <div className="text-2xl font-bold electric-blue">
                  {todaysWorkout?.exercises?.reduce((total, ex) => total + (ex.sets || 0), 0) || 18}
                </div>
                <div className="text-xs text-white/60">Sets</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercise List */}
      <div className="px-4 space-y-4">
        {todaysWorkout?.exercises?.map((exercise, exerciseIndex) => (
          <Card key={exerciseIndex} className="bg-dark-gray border-none">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{exercise.name}</h3>
                  <p className="text-white/60 text-sm mb-2">
                    {exercise.muscleGroups?.join(", ") || "Multiple muscles"}
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-electric-blue/20 text-electric-blue px-2 py-1 rounded-lg">
                      {exercise.sets} sets
                    </span>
                    <span className="text-white/60">{exercise.reps} reps</span>
                    <span className="text-white/60">{exercise.weight || "bodyweight"}</span>
                  </div>
                </div>
                {/* Exercise image placeholder */}
                <img 
                  src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" 
                  alt={exercise.name} 
                  className="w-16 h-16 rounded-xl object-cover ml-4" 
                />
              </div>

              {/* Set Tracking */}
              <div className="space-y-2 mb-4">
                {Array.from({ length: exercise.sets || 3 }, (_, setIndex) => {
                  const setKey = `${exercise.name}-${setIndex + 1}`;
                  const isCompleted = completedSets[setKey];
                  
                  return (
                    <div 
                      key={setIndex}
                      className={`flex items-center justify-between py-2 px-3 rounded-xl border ${
                        isCompleted 
                          ? "bg-success/10 border-success/20" 
                          : setIndex === 0 
                            ? "bg-electric-blue/10 border-electric-blue/20" 
                            : "bg-white/5 border-white/10"
                      }`}
                    >
                      <span className="text-sm">Set {setIndex + 1}</span>
                      <span className={`text-sm ${
                        isCompleted 
                          ? "text-success" 
                          : setIndex === 0 
                            ? "text-electric-blue" 
                            : "text-white/40"
                      }`}>
                        {isCompleted 
                          ? "✓ 10 reps @ 185 lbs" 
                          : setIndex === 0 
                            ? "In Progress" 
                            : "Pending"
                        }
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={() => handleLogSet(exercise.name, 1)}
                  disabled={logSetMutation.isPending}
                  className="flex-1 bg-electric-blue text-jet-black font-semibold py-2 px-4 rounded-xl text-sm transition-all duration-200 active:scale-95"
                >
                  Log Set
                </Button>
                <Button 
                  variant="outline"
                  className="px-4 py-2 bg-white/10 border-white/20 rounded-xl"
                >
                  <i className="fas fa-sync text-white/60"></i>
                </Button>
              </div>

              {/* Exercise Instructions */}
              {exercise.instructions && exercise.instructions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-semibold mb-2">Instructions:</h4>
                  <ul className="text-sm text-white/70 space-y-1">
                    {exercise.instructions.map((instruction, idx) => (
                      <li key={idx}>• {instruction}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        <div className="pb-24"></div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4">
        <Button className="bg-electric-blue text-jet-black p-4 rounded-full shadow-2xl glow-effect transition-all duration-200 active:scale-95">
          <i className="fas fa-play text-xl"></i>
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
}
