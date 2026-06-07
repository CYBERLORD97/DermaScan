export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

export interface Medication {
  name: string;
  price_level: 'low' | 'medium' | 'high';
  price_range_naira: string;
  effectiveness: 'high' | 'medium' | 'low';
  description: string;
}

export interface AnalysisResult {
  condition_name: string;
  severity: 'mild' | 'moderate' | 'severe';
  confidence_score: number;
  treatment_recommendations: string;
  medication_recommendations: Medication[];
  next_steps: string;
}

export interface AnalysisRecord {
  id: string;
  user_id: string;
  image_url: string;
  condition_name: string | null;
  severity: string | null;
  confidence_score: number | null;
  treatment_recommendations: string | null;
  medication_recommendations: Medication[] | null;
  created_at: string;
}

export interface Dermatologist {
  id: string;
  name: string;
  specialization: string;
  years_experience: number;
  photo_url: string | null;
  bio: string | null;
  location: string;
  consultation_fee_naira: number;
  available_days: string[];
  available_times: string[];
}

export interface Appointment {
  id: string;
  user_id: string;
  dermatologist_id: string;
  order_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';
  payment_provider: 'stripe' | 'paystack' | null;
  notes: string | null;
  created_at: string;
}
