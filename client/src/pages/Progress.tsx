import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertProgressLogSchema, type InsertProgressLog } from "@shared/schema";
import BottomNavigation from "@/components/BottomNavigation";
import { useEffect, useState } from "react";

export default function Progress() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState("30");

  const { data: progressLogs } = useQuery({
    queryKey: ["/api/progress"],
    enabled: isAuthenticated,
  });

  const { data: workoutSessions } = useQuery({
    queryKey: ["/api/workouts/sessions"],
    enabled: isAuthenticated,
  });

  const { data: insights } = useQuery({
    queryKey: ["/api/insights"],
    enabled: isAuthenticated,
  });

  const form = useForm<InsertProgressLog>({
    resolver: zodResolver(insertProgressLogSchema),
    defaultValues: {
      weight: undefined,
      bodyFat: undefined,
      muscleMass: undefined,
      measurements: {},
      notes: "",
      loggedAt: new Date(),
    }
  });

  const logProgressMutation = useMutation({
    mutationFn: async (data: InsertProgressLog) => {
      const response = await apiRequest("POST", "/api/progress", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      form.reset();
      toast({
        title: "Progress Logged!",
        description: "Your progress has been recorded successfully.",
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
        description: "Failed to log progress. Please try again.",
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

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jet-black">
        <div className="animate-spin w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentWeight = progressLogs?.[0]?.weight || 165.2;
  const totalWorkouts = workoutSessions?.length || 24;
  const trainingHours = Math.floor((totalWorkouts * 45) / 60);
  const weeklyProgress = 80; // This would be calculated from actual data

  // Calculate weight loss
  const weightLoss = progressLogs && progressLogs.length > 1 
    ? (progressLogs[progressLogs.length - 1]?.weight || 0) - currentWeight
    : 8.5;

  return (
    <div className="min-h-screen bg-jet-black pb-20">
      {/* Header */}
      <div className="pt-12 px-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            className="p-2"
            onClick={() => window.history.back()}
          >
            <i className="fas fa-arrow-left text-white text-xl"></i>
          </Button>
          <h1 className="text-xl font-bold">Progress Tracking</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="p-2">
                <i className="fas fa-plus electric-blue text-xl"></i>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-dark-gray border-white/20 text-white">
              <DialogHeader>
                <DialogTitle>Log Progress</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => logProgressMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (lbs)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="165.0"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              className="bg-white/10 border-white/20 text-white"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bodyFat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Body Fat %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="15.0"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              className="bg-white/10 border-white/20 text-white"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="How are you feeling today?"
                            {...field}
                            value={field.value || ""}
                            className="bg-white/10 border-white/20 text-white resize-none"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={logProgressMutation.isPending}
                    className="w-full bg-electric-blue text-jet-black font-bold"
                  >
                    {logProgressMutation.isPending ? "Logging..." : "Log Progress"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="px-4 space-y-6">
        {/* Weight Progress */}
        <Card className="bg-dark-gray border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Weight Progress</h3>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="bg-white/10 text-white text-sm w-auto border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-gray border-white/20">
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Weight Chart Placeholder */}
            <div className="h-48 bg-gradient-to-r from-electric-blue/10 to-transparent rounded-xl relative mb-4">
              <div className="absolute inset-4 flex items-end justify-between">
                <div className="flex flex-col items-center">
                  <div className="w-1 bg-electric-blue/60 h-20 rounded mb-2"></div>
                  <span className="text-xs text-white/60">Week 1</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-1 bg-electric-blue/70 h-24 rounded mb-2"></div>
                  <span className="text-xs text-white/60">Week 2</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-1 bg-electric-blue/80 h-28 rounded mb-2"></div>
                  <span className="text-xs text-white/60">Week 3</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-1 bg-electric-blue h-32 rounded mb-2"></div>
                  <span className="text-xs text-white/60">Week 4</span>
                </div>
              </div>
              
              {/* Current weight display */}
              <div className="absolute top-4 left-4">
                <div className="text-3xl font-bold electric-blue">{currentWeight}</div>
                <div className="text-sm text-white/60">Current Weight (lbs)</div>
              </div>
              
              {/* Progress indicator */}
              <div className="absolute top-4 right-4 text-right">
                <div className="text-lg font-bold text-success">-{Math.abs(weightLoss)} lbs</div>
                <div className="text-sm text-white/60">Total {weightLoss < 0 ? 'Loss' : 'Gain'}</div>
              </div>
            </div>

            <Button className="w-full bg-electric-blue/20 border border-electric-blue/30 text-electric-blue font-semibold py-3 px-6 rounded-xl transition-all duration-200 active:scale-95">
              Log Today's Weight
            </Button>
          </CardContent>
        </Card>

        {/* Workout Statistics */}
        <Card className="bg-dark-gray border-none">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-6">Workout Stats</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold electric-blue mb-1">{totalWorkouts}</div>
                <div className="text-sm text-white/60">Workouts Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success mb-1">{trainingHours}h</div>
                <div className="text-sm text-white/60">Total Training Time</div>
              </div>
            </div>

            {/* Weekly Activity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">This Week</span>
                <span className="text-sm electric-blue font-semibold">4/5 workouts</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-electric-blue h-2 rounded-full" style={{ width: `${weeklyProgress}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Body Measurements */}
        <Card className="bg-dark-gray border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Body Measurements</h3>
              <Button variant="ghost" className="text-electric-blue text-sm font-medium p-0">
                Edit
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-lg font-bold">42.5"</div>
                <div className="text-sm text-white/60">Chest</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-lg font-bold">32.0"</div>
                <div className="text-sm text-white/60">Waist</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-lg font-bold">15.5"</div>
                <div className="text-sm text-white/60">Arms</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-lg font-bold">24.0"</div>
                <div className="text-sm text-white/60">Thighs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        {insights && insights.insights && (
          <Card className="bg-gradient-to-r from-electric-blue/20 to-transparent border border-electric-blue/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-electric-blue/20 p-2 rounded-xl">
                  <i className="fas fa-magic electric-blue"></i>
                </div>
                <h3 className="text-xl font-bold">AI Insights</h3>
              </div>
              
              <div className="space-y-3">
                {insights.insights.map((insight: string, index: number) => (
                  <p key={index} className="text-sm text-white/80">
                    {insight}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="pb-24"></div>
      </div>

      <BottomNavigation />
    </div>
  );
}
