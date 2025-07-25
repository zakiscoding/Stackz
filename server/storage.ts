import {
  users,
  userProfiles,
  workoutPlans,
  workoutSessions,
  mealPlans,
  mealLogs,
  progressLogs,
  type User,
  type UpsertUser,
  type UserProfile,
  type InsertUserProfile,
  type WorkoutPlan,
  type InsertWorkoutPlan,
  type WorkoutSession,
  type MealPlan,
  type InsertMealPlan,
  type MealLog,
  type ProgressLog,
  type InsertProgressLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User>;
  
  // User profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile & { userId: string }): Promise<UserProfile>;
  updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile>;
  
  // Workout operations
  getUserWorkoutPlans(userId: string): Promise<WorkoutPlan[]>;
  createWorkoutPlan(plan: InsertWorkoutPlan & { userId: string }): Promise<WorkoutPlan>;
  getActiveWorkoutPlan(userId: string): Promise<WorkoutPlan | undefined>;
  deactivateUserWorkoutPlans(userId: string): Promise<void>;
  
  // Workout session operations
  createWorkoutSession(session: Omit<WorkoutSession, 'id' | 'createdAt'>): Promise<WorkoutSession>;
  getUserWorkoutSessions(userId: string, limit?: number): Promise<WorkoutSession[]>;
  
  // Meal plan operations
  getUserMealPlans(userId: string): Promise<MealPlan[]>;
  createMealPlan(plan: InsertMealPlan & { userId: string }): Promise<MealPlan>;
  getActiveMealPlan(userId: string): Promise<MealPlan | undefined>;
  deactivateUserMealPlans(userId: string): Promise<void>;
  
  // Meal log operations
  createMealLog(log: Omit<MealLog, 'id' | 'createdAt'>): Promise<MealLog>;
  getUserMealLogs(userId: string, date?: Date): Promise<MealLog[]>;
  
  // Progress tracking operations
  createProgressLog(log: InsertProgressLog & { userId: string }): Promise<ProgressLog>;
  getUserProgressLogs(userId: string, limit?: number): Promise<ProgressLog[]>;
  getLatestProgressLog(userId: string): Promise<ProgressLog | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: 'active',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  // User profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile & { userId: string }): Promise<UserProfile> {
    const [newProfile] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile> {
    const [profile] = await db
      .update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return profile;
  }
  
  // Workout operations
  async getUserWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    return await db
      .select()
      .from(workoutPlans)
      .where(eq(workoutPlans.userId, userId))
      .orderBy(desc(workoutPlans.createdAt));
  }

  async createWorkoutPlan(plan: InsertWorkoutPlan & { userId: string }): Promise<WorkoutPlan> {
    const [newPlan] = await db
      .insert(workoutPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async getActiveWorkoutPlan(userId: string): Promise<WorkoutPlan | undefined> {
    const [plan] = await db
      .select()
      .from(workoutPlans)
      .where(and(eq(workoutPlans.userId, userId), eq(workoutPlans.isActive, true)))
      .orderBy(desc(workoutPlans.createdAt));
    return plan;
  }

  async deactivateUserWorkoutPlans(userId: string): Promise<void> {
    await db
      .update(workoutPlans)
      .set({ isActive: false })
      .where(eq(workoutPlans.userId, userId));
  }
  
  // Workout session operations
  async createWorkoutSession(session: Omit<WorkoutSession, 'id' | 'createdAt'>): Promise<WorkoutSession> {
    const [newSession] = await db
      .insert(workoutSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getUserWorkoutSessions(userId: string, limit = 10): Promise<WorkoutSession[]> {
    return await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.createdAt))
      .limit(limit);
  }
  
  // Meal plan operations
  async getUserMealPlans(userId: string): Promise<MealPlan[]> {
    return await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.userId, userId))
      .orderBy(desc(mealPlans.createdAt));
  }

  async createMealPlan(plan: InsertMealPlan & { userId: string }): Promise<MealPlan> {
    const [newPlan] = await db
      .insert(mealPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async getActiveMealPlan(userId: string): Promise<MealPlan | undefined> {
    const [plan] = await db
      .select()
      .from(mealPlans)
      .where(and(eq(mealPlans.userId, userId), eq(mealPlans.isActive, true)))
      .orderBy(desc(mealPlans.createdAt));
    return plan;
  }

  async deactivateUserMealPlans(userId: string): Promise<void> {
    await db
      .update(mealPlans)
      .set({ isActive: false })
      .where(eq(mealPlans.userId, userId));
  }
  
  // Meal log operations
  async createMealLog(log: Omit<MealLog, 'id' | 'createdAt'>): Promise<MealLog> {
    const [newLog] = await db
      .insert(mealLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getUserMealLogs(userId: string, date?: Date): Promise<MealLog[]> {
    let conditions = [eq(mealLogs.userId, userId)];
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      conditions.push(
        gte(mealLogs.loggedAt, startOfDay),
        lte(mealLogs.loggedAt, endOfDay)
      );
    }
    
    return await db
      .select()
      .from(mealLogs)
      .where(and(...conditions))
      .orderBy(desc(mealLogs.loggedAt));
  }
  
  // Progress tracking operations
  async createProgressLog(log: InsertProgressLog & { userId: string }): Promise<ProgressLog> {
    const [newLog] = await db
      .insert(progressLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getUserProgressLogs(userId: string, limit = 30): Promise<ProgressLog[]> {
    return await db
      .select()
      .from(progressLogs)
      .where(eq(progressLogs.userId, userId))
      .orderBy(desc(progressLogs.loggedAt))
      .limit(limit);
  }

  async getLatestProgressLog(userId: string): Promise<ProgressLog | undefined> {
    const [log] = await db
      .select()
      .from(progressLogs)
      .where(eq(progressLogs.userId, userId))
      .orderBy(desc(progressLogs.loggedAt))
      .limit(1);
    return log;
  }
}

export const storage = new DatabaseStorage();
