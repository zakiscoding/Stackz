import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  generateWorkoutPlan, 
  generateMealPlan, 
  generateAIInsights 
} from "./services/geminiService";
import { 
  insertUserProfileSchema,
  insertProgressLogSchema 
} from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertUserProfileSchema.parse(req.body);
      
      const existingProfile = await storage.getUserProfile(userId);
      
      if (existingProfile) {
        const updatedProfile = await storage.updateUserProfile(userId, validatedData);
        res.json(updatedProfile);
      } else {
        const newProfile = await storage.createUserProfile({ ...validatedData, userId });
        res.json(newProfile);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      res.status(500).json({ message: "Failed to save profile" });
    }
  });

  // Workout plan routes
  app.get('/api/workouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workoutPlans = await storage.getUserWorkoutPlans(userId);
      res.json(workoutPlans);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      res.status(500).json({ message: "Failed to fetch workouts" });
    }
  });

  app.get('/api/workouts/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activeWorkout = await storage.getActiveWorkoutPlan(userId);
      res.json(activeWorkout);
    } catch (error) {
      console.error("Error fetching active workout:", error);
      res.status(500).json({ message: "Failed to fetch active workout" });
    }
  });

  app.post('/api/workouts/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(400).json({ message: "Please complete your profile first" });
      }

      // Deactivate existing plans
      await storage.deactivateUserWorkoutPlans(userId);
      
      // Generate new workout plan using Gemini
      const workoutPlan = await generateWorkoutPlan(
        profile.goal,
        profile.experienceLevel,
        profile.trainingDaysPerWeek,
        profile.currentWeight || undefined,
        profile.dietaryPreference || undefined
      );
      
      // Save to database
      const savedPlan = await storage.createWorkoutPlan({
        userId,
        title: workoutPlan.title,
        description: workoutPlan.description,
        planData: workoutPlan,
        isActive: true
      });
      
      res.json(savedPlan);
    } catch (error) {
      console.error("Error generating workout plan:", error);
      res.status(500).json({ message: "Failed to generate workout plan" });
    }
  });

  // Workout session routes
  app.post('/api/workouts/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.createWorkoutSession({
        ...req.body,
        userId
      });
      res.json(session);
    } catch (error) {
      console.error("Error logging workout session:", error);
      res.status(500).json({ message: "Failed to log workout session" });
    }
  });

  app.get('/api/workouts/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserWorkoutSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching workout sessions:", error);
      res.status(500).json({ message: "Failed to fetch workout sessions" });
    }
  });

  // Meal plan routes
  app.get('/api/meals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mealPlans = await storage.getUserMealPlans(userId);
      res.json(mealPlans);
    } catch (error) {
      console.error("Error fetching meals:", error);
      res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  app.get('/api/meals/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activeMeal = await storage.getActiveMealPlan(userId);
      res.json(activeMeal);
    } catch (error) {
      console.error("Error fetching active meal plan:", error);
      res.status(500).json({ message: "Failed to fetch active meal plan" });
    }
  });

  app.post('/api/meals/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(400).json({ message: "Please complete your profile first" });
      }

      // Calculate target calories based on goal and profile
      const baseCalories = 2000; // This would normally be calculated based on TDEE
      const targetCalories = profile.goal === 'cut' ? baseCalories - 500 :
                           profile.goal === 'bulk' ? baseCalories + 500 : baseCalories;

      // Deactivate existing plans
      await storage.deactivateUserMealPlans(userId);
      
      // Generate new meal plan using Gemini
      const mealPlan = await generateMealPlan(
        profile.goal,
        targetCalories,
        profile.dietaryPreference || 'omnivore',
        profile.allergies || undefined,
        profile.currentWeight || undefined
      );
      
      // Save to database
      const savedPlan = await storage.createMealPlan({
        userId,
        title: mealPlan.title,
        targetCalories: mealPlan.totalCalories,
        targetProtein: mealPlan.totalProtein,
        targetCarbs: mealPlan.totalCarbs,
        targetFat: mealPlan.totalFat,
        planData: mealPlan,
        isActive: true
      });
      
      res.json(savedPlan);
    } catch (error) {
      console.error("Error generating meal plan:", error);
      res.status(500).json({ message: "Failed to generate meal plan" });
    }
  });

  // Meal logging routes
  app.post('/api/meals/log', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mealLog = await storage.createMealLog({
        ...req.body,
        userId
      });
      res.json(mealLog);
    } catch (error) {
      console.error("Error logging meal:", error);
      res.status(500).json({ message: "Failed to log meal" });
    }
  });

  app.get('/api/meals/logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const logs = await storage.getUserMealLogs(userId, date);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching meal logs:", error);
      res.status(500).json({ message: "Failed to fetch meal logs" });
    }
  });

  // Progress tracking routes
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logs = await storage.getUserProgressLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertProgressLogSchema.parse(req.body);
      const log = await storage.createProgressLog({ ...validatedData, userId });
      res.json(log);
    } catch (error) {
      console.error("Error logging progress:", error);
      res.status(500).json({ message: "Failed to log progress" });
    }
  });

  app.get('/api/progress/latest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const latest = await storage.getLatestProgressLog(userId);
      res.json(latest);
    } catch (error) {
      console.error("Error fetching latest progress:", error);
      res.status(500).json({ message: "Failed to fetch latest progress" });
    }
  });

  // AI insights route
  app.get('/api/insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progressLogs = await storage.getUserProgressLogs(userId, 4);
      const workoutSessions = await storage.getUserWorkoutSessions(userId, 30);
      
      // Calculate stats for AI insights
      const weightProgress = progressLogs.map(log => log.weight || 0).reverse();
      const workoutConsistency = Math.min(100, (workoutSessions.length / 30) * 100);
      const goalProgress = Math.random() * 80 + 20; // This would be calculated based on actual progress
      const currentStreak = Math.floor(Math.random() * 15) + 1; // This would be tracked properly
      
      const insights = await generateAIInsights({
        weightProgress,
        workoutConsistency,
        goalProgress,
        currentStreak
      });
      
      res.json({ insights });
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  // Stripe subscription routes
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { priceId } = req.body;

      if (!user || !user.email) {
        return res.status(400).json({ message: "User email required" });
      }

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        return res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      }

      // Create or retrieve customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId }
        });
        customerId = customer.id;
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with Stripe info
      await storage.updateUserStripeInfo(userId, customerId, subscription.id);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Webhook for Stripe events
  app.post('/api/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        // Update user subscription status in database
        console.log('Subscription updated:', subscription.id, subscription.status);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
