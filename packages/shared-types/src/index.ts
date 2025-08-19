// Base types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tenant types
export interface Tenant extends BaseEntity {
  name: string;
  email: string;
  phone?: string;
  planType: "basic" | "premium" | "enterprise";
  isActive: boolean;
}

// User types
export interface User extends BaseEntity {
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "trainer" | "client";
  isActive: boolean;
  lastLoginAt?: Date;
}

// Client types
export interface Client extends BaseEntity {
  tenantId: string;
  userId: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  height?: number; // em cm
  weight?: number; // em kg
  fitnessGoal?: string;
  medicalConditions?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

// Exercise types
export interface Exercise extends BaseEntity {
  name: string;
  description: string;
  category: string;
  muscleGroups: string[];
  equipment?: string[];
  instructions?: string[];
  videoUrl?: string;
  imageUrl?: string;
}

// Workout types
export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps?: number;
  weight?: number; // em kg
  duration?: number; // em segundos
  restTime?: number; // em segundos
  notes?: string;
}

export interface Workout extends BaseEntity {
  tenantId: string;
  clientId: string;
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
  scheduledDate?: Date;
  completedDate?: Date;
  status: "planned" | "in_progress" | "completed" | "skipped";
  notes?: string;
}

// Progress Log types
export interface ProgressLog extends BaseEntity {
  clientId: string;
  date: Date;
  weight?: number; // em kg
  bodyFat?: number; // em %
  muscleMass?: number; // em kg
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    bicep?: number;
    thigh?: number;
  };
  photos?: string[]; // URLs das fotos
  notes?: string;
}

// Chat types
export interface ChatMessage extends BaseEntity {
  senderId: string;
  receiverId: string;
  tenantId: string;
  content: string;
  type: "text" | "image" | "file";
  isRead: boolean;
  readAt?: Date;
}

export interface ChatRoom extends BaseEntity {
  tenantId: string;
  participants: string[]; // User IDs
  lastMessage?: ChatMessage;
  lastActivity: Date;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName?: string; // Para novos tenants
}

export interface AuthResponse {
  user: User;
  tenant: Tenant;
  token: string;
  refreshToken: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ProgressChartData {
  weight: ChartDataPoint[];
  bodyFat: ChartDataPoint[];
  muscleMass: ChartDataPoint[];
}
