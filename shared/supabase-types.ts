export type MembershipClass = 'I' | 'II' | 'III';
export type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenanceStatus = 'current' | 'due_soon' | 'overdue';
export type UserRole = 'owner' | 'cfi' | 'staff' | 'admin' | 'ops' | 'founder';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Aircraft {
  id: string;
  tail_number: string;
  make: string;
  model: string;
  year?: number;
  class?: string;
  hobbs_hours?: number;
  tach_hours?: number;
  image_url?: string;
  owner_id?: string;
  has_tks?: boolean;
  has_oxygen?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  aircraft_id?: string;
  class: MembershipClass;
  monthly_rate?: number;
  benefits?: Record<string, any>;
  active: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
}

export interface Maintenance {
  id: string;
  aircraft_id: string;
  item_name: string;
  description?: string;
  due_date?: string;
  due_hobbs?: number;
  due_tach?: number;
  status: MaintenanceStatus;
  completed_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  aircraft_id: string;
  user_id: string;
  service_type: string;
  priority?: string;
  description: string;
  status: ServiceStatus;
  assigned_to?: string;
  airport?: string | null;
  requested_departure?: string | null;
  fuel_grade?: string | null;
  fuel_quantity?: number | null;
  cabin_provisioning?: Record<string, any> | string | null;
  o2_topoff?: boolean | null;
  tks_topoff?: boolean | null;
  gpu_required?: boolean | null;
  hangar_pullout?: boolean | null;
  is_extra_charge?: boolean | null;
  credits_used?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Instructor {
  id: string;
  user_id: string;
  certificates?: Record<string, any>;
  ratings?: Record<string, any>;
  hourly_rate?: number;
  bio?: string;
  photo_url?: string;
  availability?: Record<string, any>;
  active: boolean;
  created_at: string;
}

export interface PricingPackage {
  id: string;
  name: string;
  description?: string;
  class: MembershipClass;
  monthly_base_rate: number;
  hourly_rate?: number;
  features?: Record<string, any>;
  active: boolean;
  created_at: string;
  updated_at: string;
}
