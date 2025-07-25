import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertUserProfileSchema } from "@shared/schema";
import type { InsertUserProfile } from "@shared/schema";

const steps = [
  { title: "What's your goal?", key: "goal" },
  { title: "Experience level?", key: "experience" },
  { title: "Training schedule", key: "schedule" },
  { title: "About you", key: "personal" },
  { title: "Dietary preferences", key: "diet" }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<InsertUserProfile>({
    resolver: zodResolver(insertUserProfileSchema),
    defaultValues: {
      goal: "",
      experienceLevel: "",
      trainingDaysPerWeek: 3,
      gender: "",
      currentWeight: undefined,
      targetWeight: undefined,
      height: undefined,
      age: undefined,
      dietaryPreference: "",
      allergies: "",
      activityLevel: ""
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: InsertUserProfile) => {
      const response = await apiRequest("POST", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Created!",
        description: "Welcome to StackzFit AI. Let's get you started!",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      form.handleSubmit((data) => saveMutation.mutate(data))();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <FormField
            control={form.control}
            name="goal"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white text-lg font-semibold">What's your primary goal?</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-dark-gray border-white/20 text-white">
                      <SelectValue placeholder="Select your goal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-dark-gray border-white/20">
                    <SelectItem value="bulk">Build Muscle (Bulk)</SelectItem>
                    <SelectItem value="cut">Lose Weight (Cut)</SelectItem>
                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        );

      case 1:
        return (
          <FormField
            control={form.control}
            name="experienceLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white text-lg font-semibold">What's your experience level?</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-dark-gray border-white/20 text-white">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-dark-gray border-white/20">
                    <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        );

      case 2:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="trainingDaysPerWeek"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white text-lg font-semibold">How many days per week can you train?</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="7"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      className="bg-dark-gray border-white/20 text-white"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="activityLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white text-lg font-semibold">Activity Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-dark-gray border-white/20 text-white">
                        <SelectValue placeholder="Select activity level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-dark-gray border-white/20">
                      <SelectItem value="sedentary">Sedentary (desk job)</SelectItem>
                      <SelectItem value="lightly_active">Lightly Active</SelectItem>
                      <SelectItem value="moderately_active">Moderately Active</SelectItem>
                      <SelectItem value="very_active">Very Active</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white text-lg font-semibold">Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-dark-gray border-white/20 text-white">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-dark-gray border-white/20">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Current Weight (lbs)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        className="bg-dark-gray border-white/20 text-white"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Target Weight (lbs)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        className="bg-dark-gray border-white/20 text-white"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Height (inches)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        className="bg-dark-gray border-white/20 text-white"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Age</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="bg-dark-gray border-white/20 text-white"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="dietaryPreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white text-lg font-semibold">Dietary Preference</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-dark-gray border-white/20 text-white">
                        <SelectValue placeholder="Select dietary preference" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-dark-gray border-white/20">
                      <SelectItem value="omnivore">Omnivore</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="keto">Keto</SelectItem>
                      <SelectItem value="paleo">Paleo</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Allergies/Restrictions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any food allergies or restrictions?"
                      {...field}
                      className="bg-dark-gray border-white/20 text-white resize-none"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-jet-black">
      {/* Header */}
      <div className="flex justify-between items-center p-4 pt-12">
        <button onClick={currentStep > 0 ? prevStep : undefined} className="w-6">
          {currentStep > 0 && <span className="text-white">←</span>}
        </button>
        <div className="flex space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index <= currentStep ? "bg-electric-blue" : "bg-white/30"
              }`}
            />
          ))}
        </div>
        <button className="text-white/60 text-sm font-medium">Skip</button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">{steps[currentStep].title}</h1>
          <p className="text-white/70">Help us personalize your experience</p>
        </div>

        <Form {...form}>
          <form className="space-y-6">
            {renderStep()}
          </form>
        </Form>
      </div>

      {/* Footer */}
      <div className="p-6 mobile-safe-area">
        <Button
          onClick={nextStep}
          disabled={saveMutation.isPending}
          className="w-full bg-electric-blue text-jet-black font-bold py-4 px-6 rounded-2xl text-lg transition-all duration-200 active:scale-95 tap-highlight glow-effect h-auto"
        >
          {currentStep === steps.length - 1 
            ? (saveMutation.isPending ? "Creating Profile..." : "Complete Setup")
            : "Continue"
          }
        </Button>
      </div>
    </div>
  );
}
