import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing required environment variable: GEMINI_API_KEY');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface WorkoutExercise {
  name: string;
  muscleGroups: string[];
  sets: number;
  reps: string;
  weight?: string;
  restTime: string;
  instructions: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface WorkoutDay {
  day: string;
  type: string;
  duration: number;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlanResponse {
  title: string;
  description: string;
  weeklySchedule: WorkoutDay[];
  totalDuration: number;
  focusAreas: string[];
}

export interface MealItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients?: string[];
  instructions?: string[];
}

export interface DayMeal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface MealPlanResponse {
  title: string;
  description: string;
  dailyMeals: DayMeal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  shoppingList: string[];
}

export async function generateWorkoutPlan(
  goal: string,
  experienceLevel: string,
  trainingDays: number,
  currentWeight?: number,
  preferences?: string
): Promise<WorkoutPlanResponse> {
  try {
    const systemPrompt = `You are an expert fitness trainer and program designer. 
Create personalized workout plans based on user goals, experience level, and preferences.
Always provide practical, safe, and effective workout routines with proper progression.`;

    const userPrompt = `Create a detailed weekly workout plan for:
- Goal: ${goal}
- Experience Level: ${experienceLevel}
- Training Days per Week: ${trainingDays}
- Current Weight: ${currentWeight || 'Not specified'} lbs
- Additional Preferences: ${preferences || 'None'}

Provide a comprehensive workout plan with exercises, sets, reps, and instructions.
Focus on compound movements and progressive overload principles.
Include proper rest times and difficulty progression.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            weeklySchedule: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  type: { type: "string" },
                  duration: { type: "number" },
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        muscleGroups: {
                          type: "array",
                          items: { type: "string" }
                        },
                        sets: { type: "number" },
                        reps: { type: "string" },
                        weight: { type: "string" },
                        restTime: { type: "string" },
                        instructions: {
                          type: "array",
                          items: { type: "string" }
                        },
                        difficulty: { 
                          type: "string",
                          enum: ["beginner", "intermediate", "advanced"]
                        }
                      },
                      required: ["name", "muscleGroups", "sets", "reps", "restTime", "instructions", "difficulty"]
                    }
                  }
                },
                required: ["day", "type", "duration", "exercises"]
              }
            },
            totalDuration: { type: "number" },
            focusAreas: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["title", "description", "weeklySchedule", "totalDuration", "focusAreas"]
        }
      },
      contents: userPrompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    const workoutPlan: WorkoutPlanResponse = JSON.parse(rawJson);
    return workoutPlan;
  } catch (error) {
    console.error("Error generating workout plan:", error);
    throw new Error(`Failed to generate workout plan: ${error}`);
  }
}

export async function generateMealPlan(
  goal: string,
  targetCalories: number,
  dietaryPreference: string,
  allergies?: string,
  currentWeight?: number
): Promise<MealPlanResponse> {
  try {
    const systemPrompt = `You are an expert nutritionist and meal planning specialist.
Create personalized meal plans based on user goals, dietary preferences, and restrictions.
Always provide balanced, nutritious meals with accurate macro calculations.`;

    const userPrompt = `Create a detailed daily meal plan for:
- Goal: ${goal}
- Target Calories: ${targetCalories}
- Dietary Preference: ${dietaryPreference}
- Allergies/Restrictions: ${allergies || 'None'}
- Current Weight: ${currentWeight || 'Not specified'} lbs

Provide a complete day of meals (breakfast, lunch, dinner, snacks) with:
- Detailed nutritional information (calories, protein, carbs, fat)
- Portion sizes and ingredients
- Simple cooking instructions where needed
- A shopping list for all ingredients

Focus on whole foods, proper macro distribution, and meal variety.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            dailyMeals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { 
                    type: "string",
                    enum: ["breakfast", "lunch", "dinner", "snack"]
                  },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        portion: { type: "string" },
                        calories: { type: "number" },
                        protein: { type: "number" },
                        carbs: { type: "number" },
                        fat: { type: "number" },
                        ingredients: {
                          type: "array",
                          items: { type: "string" }
                        },
                        instructions: {
                          type: "array",
                          items: { type: "string" }
                        }
                      },
                      required: ["name", "portion", "calories", "protein", "carbs", "fat"]
                    }
                  },
                  totalCalories: { type: "number" },
                  totalProtein: { type: "number" },
                  totalCarbs: { type: "number" },
                  totalFat: { type: "number" }
                },
                required: ["type", "items", "totalCalories", "totalProtein", "totalCarbs", "totalFat"]
              }
            },
            totalCalories: { type: "number" },
            totalProtein: { type: "number" },
            totalCarbs: { type: "number" },
            totalFat: { type: "number" },
            shoppingList: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["title", "description", "dailyMeals", "totalCalories", "totalProtein", "totalCarbs", "totalFat", "shoppingList"]
        }
      },
      contents: userPrompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    const mealPlan: MealPlanResponse = JSON.parse(rawJson);
    return mealPlan;
  } catch (error) {
    console.error("Error generating meal plan:", error);
    throw new Error(`Failed to generate meal plan: ${error}`);
  }
}

export async function generateAIInsights(
  userStats: {
    weightProgress: number[];
    workoutConsistency: number;
    goalProgress: number;
    currentStreak: number;
  }
): Promise<string[]> {
  try {
    const systemPrompt = `You are an AI fitness coach providing personalized insights and motivation.
Analyze user progress data and provide 3-4 encouraging, actionable insights.
Keep insights positive, specific, and motivating.`;

    const userPrompt = `Analyze this fitness progress data and provide insights:
- Weight Progress (last 4 weeks): [${userStats.weightProgress.join(', ')}] lbs
- Workout Consistency: ${userStats.workoutConsistency}%
- Goal Progress: ${userStats.goalProgress}%
- Current Streak: ${userStats.currentStreak} days

Provide 3-4 personalized insights that are encouraging and actionable.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 4
            }
          },
          required: ["insights"]
        }
      },
      contents: userPrompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    const result = JSON.parse(rawJson);
    return result.insights;
  } catch (error) {
    console.error("Error generating AI insights:", error);
    throw new Error(`Failed to generate AI insights: ${error}`);
  }
}
