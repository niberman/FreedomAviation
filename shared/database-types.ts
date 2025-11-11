/**
 * Comprehensive Database Type Definitions
 * Auto-generated from database schema
 * Matches all tables defined in supabase-schema.sql and migration scripts
 */

// ============================================
// ENUMS
// ============================================

export type UserRole = 'owner' | 'staff' | 'cfi' | 'admin';
export type MembershipClass = 'I' | 'II' | 'III';
export type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenanceStatus = 'current' | 'due_soon' | 'overdue';

// ============================================
// CORE TABLES
// ============================================

export interface UserProfile {
  id: string; // UUID, references auth.users(id)
  email: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface Aircraft {
  id: string; // UUID
  tail_number: string;
  make: string;
  model: string;
  year?: number;
  class?: string;
  hobbs_hours?: number;
  tach_hours?: number;
  image_url?: string;
  owner_id?: string; // UUID, FK to user_profiles
  base_location?: string;
  has_tks?: boolean;
  has_oxygen?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  owner_id: string; // FK to user_profiles
  aircraft_id?: string; // FK to aircraft
  tier: MembershipClass;
  monthly_credits?: number;
  credits_remaining?: number;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// MEMBERSHIP SYSTEM
// ============================================

export interface MembershipTier {
  id: string;
  name: string;
  slug: string;
  description?: string;
  monthly_base_rate: number;
  features?: Record<string, any>;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HourBand {
  id: string;
  name: string;
  min_hours: number;
  max_hours?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MembershipPricingRule {
  id: string;
  tier_id: string; // FK to membership_tiers
  hour_band_id: string; // FK to hour_bands
  rate_per_hour?: number;
  discount_percentage?: number;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MembershipQuote {
  id: string;
  user_id: string; // FK to user_profiles
  package_id: string;
  tier_name?: string;
  base_monthly?: number;
  hangar_id?: string;
  hangar_cost?: number;
  total_monthly?: number;
  aircraft_tail?: string;
  aircraft_make?: string;
  aircraft_model?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// SERVICE SYSTEM
// ============================================

export interface Service {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  base_price?: number;
  price_unit?: string;
  credit_cost?: number;
  requires_aircraft: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  aircraft_id: string; // FK to aircraft
  user_id: string; // FK to user_profiles
  service_type: string;
  priority: string;
  description?: string;
  airport?: string;
  requested_departure?: string;
  requested_date?: string;
  requested_time?: string;
  requested_for?: string;
  fuel_grade?: string;
  fuel_quantity?: number;
  cabin_provisioning?: Record<string, any>;
  o2_topoff?: boolean;
  tks_topoff?: boolean;
  gpu_required?: boolean;
  hangar_pullout?: boolean;
  status: ServiceStatus;
  service_id?: string; // FK to services
  is_extra_charge: boolean;
  credits_used: number;
  assigned_to?: string; // FK to user_profiles
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceTask {
  id: string;
  aircraft_id: string; // FK to aircraft
  type: string;
  status: ServiceStatus;
  assigned_to?: string; // FK to user_profiles
  notes?: string;
  photos?: string[];
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceCredit {
  id: string;
  owner_id: string; // FK to user_profiles
  service_id: string; // FK to services
  credits_allocated: number;
  credits_used: number;
  credits_remaining: number; // Computed
  valid_from: string;
  valid_until?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// MAINTENANCE
// ============================================

export interface Maintenance {
  id: string;
  aircraft_id: string; // FK to aircraft
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

export interface MaintenanceDue {
  id: string;
  aircraft_id: string;
  item: string;
  due_at_date?: string;
  due_at_hours?: number;
  severity: 'high' | 'medium' | 'low';
  remaining_hours?: number;
  remaining_days?: number;
  tail_number?: string;
}

// ============================================
// CONSUMABLES
// ============================================

export interface ConsumableEvent {
  id: string;
  aircraft_id: string; // FK to aircraft
  kind: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AircraftConsumable {
  id: string;
  aircraft_id: string; // FK to aircraft
  consumable_type: string;
  quantity_current?: number;
  quantity_max?: number;
  unit?: string;
  low_threshold?: number;
  last_serviced_at?: string;
  last_serviced_hours?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// FUEL MANAGEMENT
// ============================================

export interface FBO {
  id: string;
  name: string;
  code?: string;
  airport_code?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  fuel_types?: Record<string, any>;
  services?: Record<string, any>;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientFBOCard {
  id: string;
  user_id: string; // FK to user_profiles
  fbo_id: string; // FK to fbos
  card_number?: string;
  card_type?: string;
  account_number?: string;
  is_primary: boolean;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FuelLog {
  id: string;
  aircraft_id: string; // FK to aircraft
  user_id?: string; // FK to user_profiles
  fbo_id?: string; // FK to fbos
  date: string;
  fuel_type: string;
  quantity_gallons: number;
  price_per_gallon?: number;
  total_cost?: number;
  hobbs_hours?: number;
  tach_hours?: number;
  location?: string;
  receipt_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FuelCharge {
  id: string;
  aircraft_id: string; // FK to aircraft
  fuel_log_id?: string; // FK to fuel_logs
  user_id?: string; // FK to user_profiles
  amount: number;
  quantity_gallons?: number;
  price_per_gallon?: number;
  fuel_type?: string;
  charge_date: string;
  invoice_id?: string; // FK to invoices
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FuelOrder {
  id: string;
  aircraft_id: string; // FK to aircraft
  user_id?: string; // FK to user_profiles
  requested_fbo_id?: string; // FK to fbos
  applied_fbo_id?: string; // FK to fbos
  fuel_type: string;
  quantity_gallons: number;
  requested_date?: string;
  delivery_date?: string;
  status: string;
  price_per_gallon?: number;
  total_cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FuelAuthorization {
  id: string;
  aircraft_id: string; // FK to aircraft
  user_id: string; // FK to user_profiles
  fbo_id?: string; // FK to fbos
  authorization_level: string;
  max_amount_per_fill?: number;
  max_amount_monthly?: number;
  requires_approval: boolean;
  valid_from: string;
  valid_until?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AircraftFuelStatus {
  id: string;
  aircraft_id: string; // FK to aircraft
  fuel_type: string;
  current_gallons: number;
  capacity_gallons: number;
  last_updated_at: string;
  last_updated_by?: string; // FK to user_profiles
  last_fill_date?: string;
  estimated_hours_remaining?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// DOCUMENTS & INSURANCE
// ============================================

export interface Document {
  id: string;
  aircraft_id: string; // FK to aircraft
  user_id?: string; // FK to user_profiles
  document_type: string;
  title: string;
  description?: string;
  file_url: string;
  file_name?: string;
  file_size_bytes?: number;
  mime_type?: string;
  expires_at?: string;
  is_required: boolean;
  version: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface InsurancePolicy {
  id: string;
  aircraft_id: string; // FK to aircraft
  policy_number: string;
  provider_name: string;
  provider_contact?: string;
  policy_type?: string;
  coverage_amount?: number;
  deductible?: number;
  premium_annual?: number;
  effective_date: string;
  expiration_date: string;
  document_url?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// RESERVATIONS & FLIGHT ACTIVITY
// ============================================

export interface Reservation {
  id: string;
  aircraft_id: string; // FK to aircraft
  user_id: string; // FK to user_profiles
  start_time: string;
  end_time: string;
  purpose?: string;
  destination?: string;
  cfi_id?: string; // FK to user_profiles
  status: string;
  hobbs_out?: number;
  hobbs_in?: number;
  tach_out?: number;
  tach_in?: number;
  notes?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface FlightActivity {
  id: string;
  aircraft_id: string; // FK to aircraft
  user_id?: string; // FK to user_profiles
  reservation_id?: string; // FK to reservations
  flight_date: string;
  departure_airport?: string;
  arrival_airport?: string;
  departure_time?: string;
  arrival_time?: string;
  hobbs_start?: number;
  hobbs_end?: number;
  hobbs_duration?: number; // Computed
  tach_start?: number;
  tach_end?: number;
  tach_duration?: number; // Computed
  flight_type?: string;
  landings: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// INVOICING
// ============================================

export interface Invoice {
  id: string;
  owner_id: string; // FK to user_profiles
  aircraft_id?: string; // FK to aircraft
  invoice_number: string;
  amount: number;
  status: string;
  category: 'membership' | 'instruction' | 'service';
  created_by_cfi_id?: string; // FK to user_profiles
  due_date?: string;
  paid_date?: string;
  line_items?: Record<string, any>;
  stripe_checkout_session_id?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLine {
  id: string;
  invoice_id: string; // FK to invoices
  description: string;
  quantity: number;
  unit_cents: number;
  amount_cents?: number;
  created_at: string;
}

// ============================================
// PRICING SYSTEM
// ============================================

export interface PricingLocation {
  id: string;
  name: string;
  slug: string;
  hangar_cost_monthly: number;
  description?: string;
  address?: string;
  features?: Record<string, any>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingClass {
  id: string;
  name: string;
  slug: string;
  base_monthly: number;
  description?: string;
  features?: Record<string, any>;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface SettingsPricingAssumptions {
  id: string;
  labor_rate: number;
  card_fee_pct: number;
  cfi_allocation: number;
  cleaning_supplies: number;
  overhead_per_ac: number;
  avionics_db_per_ac: number;
  updated_at: string;
}

export interface AircraftPricingOverride {
  id: string;
  aircraft_id?: string; // FK to aircraft
  location_id?: string; // FK to pricing_locations
  class_id?: string; // FK to pricing_classes
  override_monthly?: number;
  override_hangar_cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PricingSnapshot {
  id: string;
  label: string;
  payload: Record<string, any>;
  published_at: string;
  published_by?: string; // FK to user_profiles
}

// ============================================
// CFI & INSTRUCTORS
// ============================================

export interface Instructor {
  id: string;
  user_id: string; // FK to user_profiles
  certificates?: Record<string, any>;
  ratings?: Record<string, any>;
  hourly_rate?: number;
  bio?: string;
  photo_url?: string;
  availability?: Record<string, any>;
  active: boolean;
  created_at: string;
}

export interface CFISchedule {
  id: string;
  cfi_id: string; // FK to user_profiles
  date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'blocked';
  owner_id?: string; // FK to user_profiles
  aircraft_id?: string; // FK to aircraft
  notes?: string;
  google_calendar_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendarToken {
  id: string;
  user_id: string; // FK to user_profiles
  access_token: string;
  refresh_token?: string;
  token_expiry?: string;
  calendar_id?: string;
  sync_enabled: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// ONBOARDING
// ============================================

export interface OnboardingData {
  id: string;
  user_id: string; // FK to user_profiles
  step: string;
  personal_info?: Record<string, any>;
  aircraft_info?: Record<string, any>;
  membership_selection?: Record<string, any>;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// ACTIVITY LOGGING
// ============================================

export interface ActivityLog {
  id: string;
  user_id?: string; // FK to user_profiles
  aircraft_id?: string; // FK to aircraft
  action: string;
  entity_type: string;
  entity_id?: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  notes?: string;
  created_at: string;
}

// ============================================
// LEGACY (may be deprecated)
// ============================================

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

