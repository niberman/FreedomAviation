// Generated TypeScript types from Supabase schema
// Auto-generated from supabase-schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MembershipClass = 'I' | 'II' | 'III'
export type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type MaintenanceStatus = 'current' | 'due_soon' | 'overdue'
export type UserRole = 'owner' | 'ops' | 'cfi' | 'staff' | 'admin' | 'founder'

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
      }
      aircraft: {
        Row: {
          id: string
          tail_number: string
          make: string
          model: string
          year: number | null
          class: string | null
          hobbs_hours: number | null
          tach_hours: number | null
          image_url: string | null
          owner_id: string | null
          base_location: string | null
          has_tks: boolean | null
          has_oxygen: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tail_number: string
          make: string
          model: string
          year?: number | null
          class?: string | null
          hobbs_hours?: number | null
          tach_hours?: number | null
          image_url?: string | null
          owner_id?: string | null
          base_location?: string | null
          has_tks?: boolean | null
          has_oxygen?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tail_number?: string
          make?: string
          model?: string
          year?: number | null
          class?: string | null
          hobbs_hours?: number | null
          tach_hours?: number | null
          image_url?: string | null
          owner_id?: string | null
          base_location?: string | null
          has_tks?: boolean | null
          has_oxygen?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      memberships: {
        Row: {
          id: string
          owner_id: string
          aircraft_id: string | null
          tier: MembershipClass
          monthly_credits: number | null
          credits_remaining: number | null
          is_active: boolean
          start_date: string
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          aircraft_id?: string | null
          tier: MembershipClass
          monthly_credits?: number | null
          credits_remaining?: number | null
          is_active?: boolean
          start_date?: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          aircraft_id?: string | null
          tier?: MembershipClass
          monthly_credits?: number | null
          credits_remaining?: number | null
          is_active?: boolean
          start_date?: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      maintenance: {
        Row: {
          id: string
          aircraft_id: string
          item_name: string
          description: string | null
          due_date: string | null
          due_hobbs: number | null
          due_tach: number | null
          status: MaintenanceStatus
          completed_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          aircraft_id: string
          item_name: string
          description?: string | null
          due_date?: string | null
          due_hobbs?: number | null
          due_tach?: number | null
          status?: MaintenanceStatus
          completed_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          aircraft_id?: string
          item_name?: string
          description?: string | null
          due_date?: string | null
          due_hobbs?: number | null
          due_tach?: number | null
          status?: MaintenanceStatus
          completed_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      service_requests: {
        Row: {
          id: string
          aircraft_id: string
          user_id: string
          service_type: string
          priority: string
          description: string
          airport: string | null
          requested_departure: string | null
          fuel_grade: string | null
          fuel_quantity: number | null
          cabin_provisioning: Json | null
          o2_topoff: boolean | null
          tks_topoff: boolean | null
          gpu_required: boolean | null
          hangar_pullout: boolean | null
          status: ServiceStatus
          service_id: string | null
          is_extra_charge: boolean
          credits_used: number
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          aircraft_id: string
          user_id: string
          service_type: string
          priority?: string | null
          description: string
          airport?: string | null
          requested_departure?: string | null
          fuel_grade?: string | null
          fuel_quantity?: number | null
          cabin_provisioning?: Json | null
          o2_topoff?: boolean | null
          tks_topoff?: boolean | null
          gpu_required?: boolean | null
          hangar_pullout?: boolean | null
          status?: ServiceStatus
          service_id?: string | null
          is_extra_charge?: boolean
          credits_used?: number
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          aircraft_id?: string
          user_id?: string
          service_type?: string
          priority?: string | null
          description?: string
          airport?: string | null
          requested_departure?: string | null
          fuel_grade?: string | null
          fuel_quantity?: number | null
          cabin_provisioning?: Json | null
          o2_topoff?: boolean | null
          tks_topoff?: boolean | null
          gpu_required?: boolean | null
          hangar_pullout?: boolean | null
          status?: ServiceStatus
          service_id?: string | null
          is_extra_charge?: boolean
          credits_used?: number
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      service_tasks: {
        Row: {
          id: string
          aircraft_id: string
          type: string
          status: ServiceStatus
          assigned_to: string | null
          notes: string | null
          photos: string[]
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          aircraft_id: string
          type: string
          status?: ServiceStatus
          assigned_to?: string | null
          notes?: string | null
          photos?: string[]
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          aircraft_id?: string
          type?: string
          status?: ServiceStatus
          assigned_to?: string | null
          notes?: string | null
          photos?: string[]
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          owner_id: string
          aircraft_id: string
          invoice_number: string
          amount: number
          status: string
          due_date: string | null
          paid_date: string | null
          line_items: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          aircraft_id: string
          invoice_number: string
          amount: number
          status: string
          due_date?: string | null
          paid_date?: string | null
          line_items?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          aircraft_id?: string
          invoice_number?: string
          amount?: number
          status?: string
          due_date?: string | null
          paid_date?: string | null
          line_items?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      instructors: {
        Row: {
          id: string
          user_id: string
          certificates: Json | null
          ratings: Json | null
          hourly_rate: number | null
          bio: string | null
          photo_url: string | null
          availability: Json | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          certificates?: Json | null
          ratings?: Json | null
          hourly_rate?: number | null
          bio?: string | null
          photo_url?: string | null
          availability?: Json | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          certificates?: Json | null
          ratings?: Json | null
          hourly_rate?: number | null
          bio?: string | null
          photo_url?: string | null
          availability?: Json | null
          active?: boolean
          created_at?: string
        }
      }
      pricing_packages: {
        Row: {
          id: string
          name: string
          description: string | null
          class: MembershipClass
          monthly_base_rate: number
          hourly_rate: number | null
          features: Json | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          class: MembershipClass
          monthly_base_rate: number
          hourly_rate?: number | null
          features?: Json | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          class?: MembershipClass
          monthly_base_rate?: number
          hourly_rate?: number | null
          features?: Json | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          receive_service_requests: boolean
          receive_flight_instruction_requests: boolean
          receive_maintenance_alerts: boolean
          receive_emergency_requests: boolean
          email_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          receive_service_requests?: boolean
          receive_flight_instruction_requests?: boolean
          receive_maintenance_alerts?: boolean
          receive_emergency_requests?: boolean
          email_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          receive_service_requests?: boolean
          receive_flight_instruction_requests?: boolean
          receive_maintenance_alerts?: boolean
          receive_emergency_requests?: boolean
          email_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Helper types for common use cases
export type Aircraft = Database['public']['Tables']['aircraft']['Row']
export type AircraftInsert = Database['public']['Tables']['aircraft']['Insert']
export type AircraftUpdate = Database['public']['Tables']['aircraft']['Update']

export type ServiceRequest = Database['public']['Tables']['service_requests']['Row']
export type ServiceRequestInsert = Database['public']['Tables']['service_requests']['Insert']
export type ServiceRequestUpdate = Database['public']['Tables']['service_requests']['Update']

export type ServiceTask = Database['public']['Tables']['service_tasks']['Row']
export type ServiceTaskInsert = Database['public']['Tables']['service_tasks']['Insert']
export type ServiceTaskUpdate = Database['public']['Tables']['service_tasks']['Update']

export type Membership = Database['public']['Tables']['memberships']['Row']
export type MembershipInsert = Database['public']['Tables']['memberships']['Insert']
export type MembershipUpdate = Database['public']['Tables']['memberships']['Update']

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type Maintenance = Database['public']['Tables']['maintenance']['Row']
export type MaintenanceInsert = Database['public']['Tables']['maintenance']['Insert']
export type MaintenanceUpdate = Database['public']['Tables']['maintenance']['Update']

export type Instructor = Database['public']['Tables']['instructors']['Row']
export type InstructorInsert = Database['public']['Tables']['instructors']['Insert']
export type InstructorUpdate = Database['public']['Tables']['instructors']['Update']

export type PricingPackage = Database['public']['Tables']['pricing_packages']['Row']
export type PricingPackageInsert = Database['public']['Tables']['pricing_packages']['Insert']
export type PricingPackageUpdate = Database['public']['Tables']['pricing_packages']['Update']

export type NotificationPreferences = Database['public']['Tables']['notification_preferences']['Row']
export type NotificationPreferencesInsert = Database['public']['Tables']['notification_preferences']['Insert']
export type NotificationPreferencesUpdate = Database['public']['Tables']['notification_preferences']['Update']
