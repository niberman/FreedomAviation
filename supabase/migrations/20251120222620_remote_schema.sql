create type "public"."fuel_billing_directive" as enum ('DIRECT_TO_FBO_CLIENT_CARD', 'FA_CARD_REBILL_CLIENT', 'CLIENT_INVOICE_FROM_FBO', 'HOLD_DONT_FUEL');

create type "public"."fuel_order_target" as enum ('ADD_QUANTITY', 'FILL_TO_TABS', 'FILL_TO_TABS_PLUS', 'FILL_TO_FULL');

create type "public"."fuel_status_method" as enum ('manual', 'dipstick', 'sensor', 'calc', 'fuel_log');

create type "public"."fuel_type" as enum ('AVGAS_100LL', 'JET_A', 'MOGAS', 'JET_A_WITH_PRIST');

create type "public"."maintenance_status" as enum ('current', 'due_soon', 'overdue');

create type "public"."membership_class" as enum ('I', 'II', 'III');

create type "public"."service_status" as enum ('pending', 'in_progress', 'completed', 'cancelled');

create type "public"."user_role" as enum ('owner', 'staff', 'cfi', 'admin', 'ops', 'founder');

create table "public"."aircraft" (
    "id" uuid not null default gen_random_uuid(),
    "tail_number" text not null,
    "model" text not null,
    "owner_id" uuid,
    "base_location" text default 'KAPA'::text,
    "status" text default 'active'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "usable_fuel_gal" numeric(6,1),
    "tabs_fuel_gal" numeric(6,1),
    "make" text,
    "year" integer,
    "class" text,
    "hobbs_hours" numeric(10,2),
    "tach_hours" numeric(10,2),
    "image_url" text,
    "has_tks" boolean default false,
    "has_oxygen" boolean default false
);


alter table "public"."aircraft" enable row level security;

create table "public"."cfi_schedule" (
    "id" uuid not null default gen_random_uuid(),
    "cfi_id" uuid not null,
    "date" date not null,
    "start_time" time without time zone not null,
    "end_time" time without time zone not null,
    "status" text not null,
    "owner_id" uuid,
    "aircraft_id" uuid,
    "notes" text,
    "google_calendar_event_id" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."cfi_schedule" enable row level security;

create table "public"."client_billing_profiles" (
    "user_id" uuid not null,
    "stripe_customer_id" text,
    "stripe_default_pm_id" text,
    "display_brand" text,
    "display_last4" text,
    "display_exp" text,
    "fbo_card_brand" text,
    "fbo_card_last4" text,
    "fbo_card_exp" text,
    "fbo_authorization_doc_url" text,
    "updated_at" timestamp with time zone default now()
);


create table "public"."consumable_events" (
    "id" uuid not null default gen_random_uuid(),
    "aircraft_id" uuid not null,
    "kind" text not null,
    "quantity" numeric,
    "unit" text,
    "noted_at" timestamp with time zone default now(),
    "notes" text,
    "recorded_by" uuid default auth.uid()
);


create table "public"."credit_transactions" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid not null,
    "transaction_type" text not null,
    "amount" numeric(10,2) not null,
    "balance_after" numeric(10,2),
    "description" text,
    "service_request_id" uuid,
    "created_by" uuid,
    "created_at" timestamp with time zone default now()
);


alter table "public"."credit_transactions" enable row level security;

create table "public"."email_notifications" (
    "id" uuid not null default gen_random_uuid(),
    "type" text not null,
    "recipient_role" text not null,
    "data" jsonb not null,
    "status" text default 'pending'::text,
    "sent_at" timestamp with time zone,
    "error_message" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."email_notifications" enable row level security;

create table "public"."flight_logs" (
    "id" uuid not null default gen_random_uuid(),
    "aircraft_id" uuid not null,
    "pilot_id" uuid not null,
    "date" date not null,
    "departure_time" time without time zone,
    "arrival_time" time without time zone,
    "departure_airport" text,
    "arrival_airport" text,
    "flight_time_hours" numeric(10,2),
    "hobbs_start" numeric(10,2),
    "hobbs_end" numeric(10,2),
    "tach_start" numeric(10,2),
    "tach_end" numeric(10,2),
    "landings" integer default 0,
    "night_time" numeric(10,2) default 0,
    "instrument_time" numeric(10,2) default 0,
    "cross_country" boolean default false,
    "remarks" text,
    "verified_by" uuid,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."flight_logs" enable row level security;

create table "public"."fuel_records" (
    "id" uuid not null default gen_random_uuid(),
    "aircraft_id" uuid not null,
    "fuel_type" text not null,
    "gallons" numeric(10,2) not null,
    "price_per_gallon" numeric(10,2),
    "total_cost" numeric(10,2),
    "vendor" text,
    "location" text,
    "date" date default CURRENT_DATE,
    "hobbs_at_fuel" numeric(10,2),
    "tach_at_fuel" numeric(10,2),
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."fuel_records" enable row level security;

create table "public"."google_calendar_tokens" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "access_token" text not null,
    "refresh_token" text,
    "token_expiry" timestamp with time zone,
    "calendar_id" text,
    "sync_enabled" boolean default true,
    "last_sync_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."google_calendar_tokens" enable row level security;

create table "public"."hangar_reservations" (
    "id" uuid not null default gen_random_uuid(),
    "hangar_id" uuid not null,
    "user_id" uuid not null,
    "aircraft_id" uuid,
    "start_date" date not null,
    "end_date" date not null,
    "status" text default 'pending'::text,
    "monthly_rate" numeric(10,2),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."hangar_reservations" enable row level security;

create table "public"."hangar_spaces" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "location" text not null,
    "size_sqft" integer,
    "monthly_rate" numeric(10,2),
    "status" text default 'available'::text,
    "features" text[],
    "current_tenant_id" uuid,
    "current_aircraft_id" uuid,
    "lease_start" date,
    "lease_end" date,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."hangar_spaces" enable row level security;

create table "public"."instruction_requests" (
    "id" uuid not null default gen_random_uuid(),
    "student_id" uuid not null,
    "aircraft_id" uuid not null,
    "cfi_id" uuid,
    "requested_date" date not null,
    "requested_time" time without time zone,
    "instruction_type" text default 'Flight Instruction'::text,
    "duration_hours" numeric(3,1) default 1.0,
    "notes" text,
    "status" text default 'pending'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."instruction_requests" enable row level security;

create table "public"."invoice_lines" (
    "id" uuid not null default gen_random_uuid(),
    "invoice_id" uuid not null,
    "description" text not null,
    "quantity" numeric not null default 1,
    "unit_cents" integer not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."invoice_lines" enable row level security;

create table "public"."invoices" (
    "id" uuid not null default gen_random_uuid(),
    "aircraft_id" uuid,
    "owner_id" uuid,
    "period_start" date,
    "period_end" date,
    "total_cents" integer not null default 0,
    "status" text not null default 'draft'::text,
    "hosted_invoice_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "invoice_number" text not null,
    "amount" numeric(10,2) not null,
    "category" text not null default 'membership'::text,
    "created_by_cfi_id" uuid,
    "due_date" date,
    "paid_date" date,
    "line_items" jsonb,
    "stripe_checkout_session_id" text,
    "stripe_payment_intent_id" text
);


alter table "public"."invoices" enable row level security;

create table "public"."maintenance" (
    "id" uuid not null default gen_random_uuid(),
    "aircraft_id" uuid not null,
    "item_name" text not null,
    "description" text,
    "due_date" date,
    "due_hobbs" numeric(10,2),
    "due_tach" numeric(10,2),
    "status" maintenance_status default 'current'::maintenance_status,
    "completed_date" date,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."maintenance" enable row level security;

create table "public"."membership_quotes" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "package_id" text not null,
    "tier_name" text,
    "base_monthly" numeric(10,2),
    "hangar_id" text,
    "hangar_cost" numeric(10,2),
    "total_monthly" numeric(10,2),
    "aircraft_tail" text,
    "aircraft_make" text,
    "aircraft_model" text,
    "status" text default 'pending'::text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."membership_quotes" enable row level security;

create table "public"."membership_tiers" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "base_price" numeric(10,2),
    "description" text,
    "min_hours_per_month" numeric(5,2) default 0,
    "max_hours_per_month" numeric(5,2),
    "credit_multiplier" numeric(3,2) default 1.0,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."membership_tiers" enable row level security;

create table "public"."memberships" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid not null,
    "tier" text,
    "start_date" timestamp with time zone not null default now(),
    "end_date" timestamp with time zone,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "tier_id" uuid,
    "aircraft_id" uuid
);


alter table "public"."memberships" enable row level security;

create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "type" text not null,
    "title" text not null,
    "message" text not null,
    "is_read" boolean default false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "metadata" jsonb
);


alter table "public"."notifications" enable row level security;

create table "public"."onboarding_data" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "step" text default 'welcome'::text,
    "personal_info" jsonb,
    "aircraft_info" jsonb,
    "membership_selection" jsonb,
    "stripe_customer_id" text,
    "stripe_subscription_id" text,
    "completed" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."onboarding_data" enable row level security;

create table "public"."pricing_classes" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "base_monthly" numeric(10,2) not null,
    "description" text,
    "features" jsonb,
    "sort_order" integer default 0,
    "active" boolean default true,
    "created_at" timestamp with time zone default now()
);


alter table "public"."pricing_classes" enable row level security;

create table "public"."pricing_locations" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "hangar_cost_monthly" numeric(10,2) not null default 0,
    "description" text,
    "address" text,
    "features" jsonb,
    "active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."pricing_locations" enable row level security;

create table "public"."service_credits" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid not null,
    "credits_total" numeric(10,2) default 0,
    "credits_used" numeric(10,2) default 0,
    "credits_remaining" numeric(10,2) default 0,
    "billing_cycle_start" date,
    "billing_cycle_end" date,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."service_credits" enable row level security;

create table "public"."service_requests" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "aircraft_id" uuid not null,
    "service_type" text not null,
    "description" text not null,
    "priority" text not null default 'medium'::text,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "airport" text default 'KAPA'::text,
    "service_id" uuid,
    "is_extra_charge" boolean default false,
    "credits_used" integer default 0,
    "requested_departure" timestamp with time zone,
    "fuel_grade" text,
    "fuel_quantity" numeric(6,2),
    "cabin_provisioning" jsonb default '{}'::jsonb,
    "o2_topoff" boolean,
    "tks_topoff" boolean,
    "gpu_required" boolean,
    "hangar_pullout" boolean,
    "requested_date" date,
    "requested_time" time without time zone,
    "assigned_to" uuid,
    "notes" text
);


alter table "public"."service_requests" enable row level security;

create table "public"."service_tasks" (
    "id" uuid not null default gen_random_uuid(),
    "aircraft_id" uuid not null,
    "type" text not null,
    "status" text not null default 'pending'::text,
    "assigned_to" uuid,
    "notes" text,
    "photos" jsonb default '[]'::jsonb,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."service_tasks" enable row level security;

create table "public"."settings" (
    "id" integer not null default 1,
    "default_fuel_rate" numeric(10,2)
);


create table "public"."settings_pricing_assumptions" (
    "id" uuid not null default gen_random_uuid(),
    "labor_rate" numeric(10,2) not null default 30,
    "card_fee_pct" numeric(5,2) not null default 3,
    "cfi_allocation" numeric(10,2) not null default 42,
    "cleaning_supplies" numeric(10,2) not null default 50,
    "overhead_per_ac" numeric(10,2) not null default 106,
    "avionics_db_per_ac" numeric(10,2) not null default 0,
    "updated_at" timestamp with time zone default now()
);


alter table "public"."settings_pricing_assumptions" enable row level security;

create table "public"."support_tickets" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid not null,
    "subject" text not null,
    "body" text,
    "status" text default 'open'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."support_tickets" enable row level security;

create table "public"."user_profiles" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text,
    "phone" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "stripe_customer_id" text,
    "stripe_subscription_id" text,
    "role" user_role default 'owner'::user_role
);


alter table "public"."user_profiles" enable row level security;

CREATE UNIQUE INDEX aircraft_pkey ON public.aircraft USING btree (id);

CREATE UNIQUE INDEX aircraft_tail_number_key ON public.aircraft USING btree (tail_number);

CREATE UNIQUE INDEX cfi_schedule_pkey ON public.cfi_schedule USING btree (id);

CREATE UNIQUE INDEX client_billing_profiles_pkey ON public.client_billing_profiles USING btree (user_id);

CREATE INDEX consumable_events_aircraft_idx ON public.consumable_events USING btree (aircraft_id, noted_at DESC);

CREATE UNIQUE INDEX consumable_events_pkey ON public.consumable_events USING btree (id);

CREATE UNIQUE INDEX credit_transactions_pkey ON public.credit_transactions USING btree (id);

CREATE UNIQUE INDEX email_notifications_pkey ON public.email_notifications USING btree (id);

CREATE UNIQUE INDEX flight_logs_pkey ON public.flight_logs USING btree (id);

CREATE UNIQUE INDEX fuel_records_pkey ON public.fuel_records USING btree (id);

CREATE UNIQUE INDEX google_calendar_tokens_pkey ON public.google_calendar_tokens USING btree (id);

CREATE UNIQUE INDEX google_calendar_tokens_user_id_key ON public.google_calendar_tokens USING btree (user_id);

CREATE UNIQUE INDEX hangar_reservations_pkey ON public.hangar_reservations USING btree (id);

CREATE UNIQUE INDEX hangar_spaces_pkey ON public.hangar_spaces USING btree (id);

CREATE INDEX idx_aircraft_features ON public.aircraft USING btree (has_tks, has_oxygen);

CREATE INDEX idx_aircraft_owner ON public.aircraft USING btree (owner_id);

CREATE INDEX idx_cfi_schedule_cfi_date ON public.cfi_schedule USING btree (cfi_id, date);

CREATE INDEX idx_cfi_schedule_date ON public.cfi_schedule USING btree (date);

CREATE INDEX idx_cfi_schedule_google_event ON public.cfi_schedule USING btree (google_calendar_event_id) WHERE (google_calendar_event_id IS NOT NULL);

CREATE INDEX idx_cfi_schedule_status ON public.cfi_schedule USING btree (status);

CREATE INDEX idx_credit_transactions_owner ON public.credit_transactions USING btree (owner_id);

CREATE INDEX idx_email_notifications_status ON public.email_notifications USING btree (status);

CREATE INDEX idx_email_notifications_type ON public.email_notifications USING btree (type);

CREATE INDEX idx_flight_logs_aircraft ON public.flight_logs USING btree (aircraft_id);

CREATE INDEX idx_flight_logs_date ON public.flight_logs USING btree (date DESC);

CREATE INDEX idx_flight_logs_pilot ON public.flight_logs USING btree (pilot_id);

CREATE INDEX idx_flight_logs_verifier ON public.flight_logs USING btree (verified_by);

CREATE INDEX idx_fuel_records_aircraft ON public.fuel_records USING btree (aircraft_id);

CREATE INDEX idx_fuel_records_date ON public.fuel_records USING btree (date);

CREATE INDEX idx_google_calendar_tokens_user ON public.google_calendar_tokens USING btree (user_id);

CREATE INDEX idx_hangar_reservations_hangar ON public.hangar_reservations USING btree (hangar_id);

CREATE INDEX idx_hangar_reservations_user ON public.hangar_reservations USING btree (user_id);

CREATE INDEX idx_hangar_spaces_status ON public.hangar_spaces USING btree (status);

CREATE INDEX idx_invoice_lines_invoice ON public.invoice_lines USING btree (invoice_id);

CREATE INDEX idx_invoice_lines_invoice_id ON public.invoice_lines USING btree (invoice_id);

CREATE INDEX idx_invoices_aircraft ON public.invoices USING btree (aircraft_id);

CREATE INDEX idx_invoices_aircraft_id ON public.invoices USING btree (aircraft_id);

CREATE INDEX idx_invoices_category ON public.invoices USING btree (category);

CREATE INDEX idx_invoices_created_by_cfi_id ON public.invoices USING btree (created_by_cfi_id);

CREATE INDEX idx_invoices_owner ON public.invoices USING btree (owner_id);

CREATE INDEX idx_invoices_owner_id ON public.invoices USING btree (owner_id);

CREATE INDEX idx_invoices_stripe_checkout ON public.invoices USING btree (stripe_checkout_session_id);

CREATE INDEX idx_invoices_stripe_payment_intent ON public.invoices USING btree (stripe_payment_intent_id);

CREATE INDEX idx_maintenance_aircraft ON public.maintenance USING btree (aircraft_id);

CREATE INDEX idx_maintenance_due_date ON public.maintenance USING btree (due_date);

CREATE INDEX idx_maintenance_status ON public.maintenance USING btree (status);

CREATE INDEX idx_membership_quotes_created_at ON public.membership_quotes USING btree (created_at DESC);

CREATE INDEX idx_membership_quotes_status ON public.membership_quotes USING btree (status);

CREATE INDEX idx_membership_quotes_user_id ON public.membership_quotes USING btree (user_id);

CREATE INDEX idx_membership_tiers_active ON public.membership_tiers USING btree (is_active);

CREATE INDEX idx_memberships_active ON public.memberships USING btree (is_active);

CREATE INDEX idx_memberships_owner ON public.memberships USING btree (owner_id);

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);

CREATE INDEX idx_onboarding_data_user_id ON public.onboarding_data USING btree (user_id);

CREATE INDEX idx_pricing_classes_active ON public.pricing_classes USING btree (active);

CREATE INDEX idx_pricing_classes_slug ON public.pricing_classes USING btree (slug);

CREATE INDEX idx_pricing_locations_active ON public.pricing_locations USING btree (active);

CREATE INDEX idx_pricing_locations_slug ON public.pricing_locations USING btree (slug);

CREATE INDEX idx_service_credits_owner ON public.service_credits USING btree (owner_id);

CREATE INDEX idx_service_requests_aircraft_id ON public.service_requests USING btree (aircraft_id);

CREATE INDEX idx_service_requests_airport ON public.service_requests USING btree (airport);

CREATE INDEX idx_service_requests_assigned_to ON public.service_requests USING btree (assigned_to);

CREATE INDEX idx_service_requests_requested_departure ON public.service_requests USING btree (requested_departure);

CREATE INDEX idx_service_requests_service_id ON public.service_requests USING btree (service_id);

CREATE INDEX idx_service_requests_status ON public.service_requests USING btree (status);

CREATE INDEX idx_service_requests_status_created ON public.service_requests USING btree (status, created_at DESC);

CREATE INDEX idx_service_requests_user_id ON public.service_requests USING btree (user_id);

CREATE INDEX idx_service_tasks_aircraft ON public.service_tasks USING btree (aircraft_id);

CREATE INDEX idx_service_tasks_status ON public.service_tasks USING btree (status);

CREATE INDEX idx_sr_aircraft ON public.service_requests USING btree (aircraft_id);

CREATE INDEX idx_sr_created_at ON public.service_requests USING btree (created_at);

CREATE INDEX idx_sr_status ON public.service_requests USING btree (status);

CREATE INDEX idx_support_tickets_owner ON public.support_tickets USING btree (owner_id);

CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status);

CREATE INDEX idx_user_profiles_stripe_customer_id ON public.user_profiles USING btree (stripe_customer_id);

CREATE UNIQUE INDEX instruction_requests_pkey ON public.instruction_requests USING btree (id);

CREATE UNIQUE INDEX invoice_lines_pkey ON public.invoice_lines USING btree (id);

CREATE INDEX invoices_owner_period_idx ON public.invoices USING btree (owner_id, period_start, period_end);

CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);

CREATE UNIQUE INDEX maintenance_pkey ON public.maintenance USING btree (id);

CREATE UNIQUE INDEX membership_quotes_pkey ON public.membership_quotes USING btree (id);

CREATE UNIQUE INDEX membership_tiers_name_key ON public.membership_tiers USING btree (name);

CREATE UNIQUE INDEX membership_tiers_pkey ON public.membership_tiers USING btree (id);

CREATE INDEX memberships_aircraft_active_idx ON public.memberships USING btree (aircraft_id, is_active);

CREATE UNIQUE INDEX memberships_one_active_per_aircraft ON public.memberships USING btree (aircraft_id, is_active);

CREATE UNIQUE INDEX memberships_pkey ON public.memberships USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX onboarding_data_pkey ON public.onboarding_data USING btree (id);

CREATE UNIQUE INDEX onboarding_data_user_id_key ON public.onboarding_data USING btree (user_id);

CREATE UNIQUE INDEX one_active_aircraft_per_owner ON public.aircraft USING btree (owner_id) WHERE (status = 'active'::text);

CREATE UNIQUE INDEX pricing_assumptions_pkey ON public.settings_pricing_assumptions USING btree (id);

CREATE UNIQUE INDEX pricing_classes_pkey ON public.pricing_classes USING btree (id);

CREATE UNIQUE INDEX pricing_classes_slug_key ON public.pricing_classes USING btree (slug);

CREATE UNIQUE INDEX pricing_locations_pkey ON public.pricing_locations USING btree (id);

CREATE UNIQUE INDEX pricing_locations_slug_key ON public.pricing_locations USING btree (slug);

CREATE UNIQUE INDEX profiles_pkey ON public.user_profiles USING btree (id);

CREATE UNIQUE INDEX service_credits_pkey ON public.service_credits USING btree (id);

CREATE UNIQUE INDEX service_requests_pkey ON public.service_requests USING btree (id);

CREATE INDEX service_tasks_aircraft_status_idx ON public.service_tasks USING btree (aircraft_id, status);

CREATE UNIQUE INDEX service_tasks_pkey ON public.service_tasks USING btree (id);

CREATE UNIQUE INDEX settings_pkey ON public.settings USING btree (id);

CREATE UNIQUE INDEX support_tickets_pkey ON public.support_tickets USING btree (id);

alter table "public"."aircraft" add constraint "aircraft_pkey" PRIMARY KEY using index "aircraft_pkey";

alter table "public"."cfi_schedule" add constraint "cfi_schedule_pkey" PRIMARY KEY using index "cfi_schedule_pkey";

alter table "public"."client_billing_profiles" add constraint "client_billing_profiles_pkey" PRIMARY KEY using index "client_billing_profiles_pkey";

alter table "public"."consumable_events" add constraint "consumable_events_pkey" PRIMARY KEY using index "consumable_events_pkey";

alter table "public"."credit_transactions" add constraint "credit_transactions_pkey" PRIMARY KEY using index "credit_transactions_pkey";

alter table "public"."email_notifications" add constraint "email_notifications_pkey" PRIMARY KEY using index "email_notifications_pkey";

alter table "public"."flight_logs" add constraint "flight_logs_pkey" PRIMARY KEY using index "flight_logs_pkey";

alter table "public"."fuel_records" add constraint "fuel_records_pkey" PRIMARY KEY using index "fuel_records_pkey";

alter table "public"."google_calendar_tokens" add constraint "google_calendar_tokens_pkey" PRIMARY KEY using index "google_calendar_tokens_pkey";

alter table "public"."hangar_reservations" add constraint "hangar_reservations_pkey" PRIMARY KEY using index "hangar_reservations_pkey";

alter table "public"."hangar_spaces" add constraint "hangar_spaces_pkey" PRIMARY KEY using index "hangar_spaces_pkey";

alter table "public"."instruction_requests" add constraint "instruction_requests_pkey" PRIMARY KEY using index "instruction_requests_pkey";

alter table "public"."invoice_lines" add constraint "invoice_lines_pkey" PRIMARY KEY using index "invoice_lines_pkey";

alter table "public"."invoices" add constraint "invoices_pkey" PRIMARY KEY using index "invoices_pkey";

alter table "public"."maintenance" add constraint "maintenance_pkey" PRIMARY KEY using index "maintenance_pkey";

alter table "public"."membership_quotes" add constraint "membership_quotes_pkey" PRIMARY KEY using index "membership_quotes_pkey";

alter table "public"."membership_tiers" add constraint "membership_tiers_pkey" PRIMARY KEY using index "membership_tiers_pkey";

alter table "public"."memberships" add constraint "memberships_pkey" PRIMARY KEY using index "memberships_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."onboarding_data" add constraint "onboarding_data_pkey" PRIMARY KEY using index "onboarding_data_pkey";

alter table "public"."pricing_classes" add constraint "pricing_classes_pkey" PRIMARY KEY using index "pricing_classes_pkey";

alter table "public"."pricing_locations" add constraint "pricing_locations_pkey" PRIMARY KEY using index "pricing_locations_pkey";

alter table "public"."service_credits" add constraint "service_credits_pkey" PRIMARY KEY using index "service_credits_pkey";

alter table "public"."service_requests" add constraint "service_requests_pkey" PRIMARY KEY using index "service_requests_pkey";

alter table "public"."service_tasks" add constraint "service_tasks_pkey" PRIMARY KEY using index "service_tasks_pkey";

alter table "public"."settings" add constraint "settings_pkey" PRIMARY KEY using index "settings_pkey";

alter table "public"."settings_pricing_assumptions" add constraint "pricing_assumptions_pkey" PRIMARY KEY using index "pricing_assumptions_pkey";

alter table "public"."support_tickets" add constraint "support_tickets_pkey" PRIMARY KEY using index "support_tickets_pkey";

alter table "public"."user_profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."aircraft" add constraint "aircraft_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES user_profiles(id) ON DELETE SET NULL not valid;

alter table "public"."aircraft" validate constraint "aircraft_owner_id_fkey";

alter table "public"."aircraft" add constraint "aircraft_tail_number_key" UNIQUE using index "aircraft_tail_number_key";

alter table "public"."cfi_schedule" add constraint "cfi_schedule_aircraft_id_fkey" FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE SET NULL not valid;

alter table "public"."cfi_schedule" validate constraint "cfi_schedule_aircraft_id_fkey";

alter table "public"."cfi_schedule" add constraint "cfi_schedule_cfi_id_fkey" FOREIGN KEY (cfi_id) REFERENCES user_profiles(id) ON DELETE SET NULL not valid;

alter table "public"."cfi_schedule" validate constraint "cfi_schedule_cfi_id_fkey";

alter table "public"."cfi_schedule" add constraint "cfi_schedule_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES user_profiles(id) ON DELETE SET NULL not valid;

alter table "public"."cfi_schedule" validate constraint "cfi_schedule_owner_id_fkey";

alter table "public"."cfi_schedule" add constraint "cfi_schedule_status_check" CHECK ((status = ANY (ARRAY['available'::text, 'booked'::text, 'blocked'::text]))) not valid;

alter table "public"."cfi_schedule" validate constraint "cfi_schedule_status_check";

alter table "public"."cfi_schedule" add constraint "valid_time_range" CHECK ((start_time < end_time)) not valid;

alter table "public"."cfi_schedule" validate constraint "valid_time_range";

alter table "public"."client_billing_profiles" add constraint "client_billing_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."client_billing_profiles" validate constraint "client_billing_profiles_user_id_fkey";

alter table "public"."consumable_events" add constraint "consumable_events_aircraft_id_fkey" FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE CASCADE not valid;

alter table "public"."consumable_events" validate constraint "consumable_events_aircraft_id_fkey";

alter table "public"."consumable_events" add constraint "consumable_events_kind_check" CHECK ((kind = ANY (ARRAY['OIL'::text, 'O2'::text, 'TKS'::text]))) not valid;

alter table "public"."consumable_events" validate constraint "consumable_events_kind_check";

alter table "public"."credit_transactions" add constraint "credit_transactions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES user_profiles(id) not valid;

alter table "public"."credit_transactions" validate constraint "credit_transactions_created_by_fkey";

alter table "public"."credit_transactions" add constraint "credit_transactions_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES user_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."credit_transactions" validate constraint "credit_transactions_owner_id_fkey";

alter table "public"."credit_transactions" add constraint "credit_transactions_service_request_id_fkey" FOREIGN KEY (service_request_id) REFERENCES service_requests(id) not valid;

alter table "public"."credit_transactions" validate constraint "credit_transactions_service_request_id_fkey";

alter table "public"."flight_logs" add constraint "flight_logs_aircraft_id_fkey" FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) not valid;

alter table "public"."flight_logs" validate constraint "flight_logs_aircraft_id_fkey";

alter table "public"."flight_logs" add constraint "flight_logs_pilot_id_fkey" FOREIGN KEY (pilot_id) REFERENCES user_profiles(id) ON DELETE SET NULL not valid;

alter table "public"."flight_logs" validate constraint "flight_logs_pilot_id_fkey";

alter table "public"."flight_logs" add constraint "flight_logs_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES user_profiles(id) ON DELETE SET NULL not valid;

alter table "public"."flight_logs" validate constraint "flight_logs_verified_by_fkey";

alter table "public"."fuel_records" add constraint "fuel_records_aircraft_id_fkey" FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) not valid;

alter table "public"."fuel_records" validate constraint "fuel_records_aircraft_id_fkey";

alter table "public"."google_calendar_tokens" add constraint "google_calendar_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."google_calendar_tokens" validate constraint "google_calendar_tokens_user_id_fkey";

alter table "public"."google_calendar_tokens" add constraint "google_calendar_tokens_user_id_key" UNIQUE using index "google_calendar_tokens_user_id_key";

alter table "public"."hangar_reservations" add constraint "hangar_reservations_aircraft_id_fkey" FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) not valid;

alter table "public"."hangar_reservations" validate constraint "hangar_reservations_aircraft_id_fkey";

alter table "public"."hangar_reservations" add constraint "hangar_reservations_hangar_id_fkey" FOREIGN KEY (hangar_id) REFERENCES hangar_spaces(id) not valid;

alter table "public"."hangar_reservations" validate constraint "hangar_reservations_hangar_id_fkey";

alter table "public"."hangar_reservations" add constraint "hangar_reservations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."hangar_reservations" validate constraint "hangar_reservations_user_id_fkey";

alter table "public"."hangar_spaces" add constraint "hangar_spaces_current_aircraft_id_fkey" FOREIGN KEY (current_aircraft_id) REFERENCES aircraft(id) not valid;

alter table "public"."hangar_spaces" validate constraint "hangar_spaces_current_aircraft_id_fkey";

alter table "public"."hangar_spaces" add constraint "hangar_spaces_current_tenant_id_fkey" FOREIGN KEY (current_tenant_id) REFERENCES user_profiles(id) ON DELETE SET NULL not valid;

alter table "public"."hangar_spaces" validate constraint "hangar_spaces_current_tenant_id_fkey";

alter table "public"."instruction_requests" add constraint "instruction_requests_aircraft_id_fkey" FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) not valid;

alter table "public"."instruction_requests" validate constraint "instruction_requests_aircraft_id_fkey";

alter table "public"."instruction_requests" add constraint "instruction_requests_cfi_id_fkey" FOREIGN KEY (cfi_id) REFERENCES user_profiles(id) ON DELETE SET NULL not valid;

alter table "public"."instruction_requests" validate constraint "instruction_requests_cfi_id_fkey";

alter table "public"."instruction_requests" add constraint "instruction_requests_student_id_fkey" FOREIGN KEY (student_id) REFERENCES user_profiles(id) ON DELETE SET NULL not valid;

alter table "public"."instruction_requests" validate constraint "instruction_requests_student_id_fkey";

alter table "public"."invoice_lines" add constraint "invoice_lines_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE not valid;

alter table "public"."invoice_lines" validate constraint "invoice_lines_invoice_id_fkey";

alter table "public"."invoices" add constraint "invoices_aircraft_id_fkey" FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE RESTRICT not valid;

alter table "public"."invoices" validate constraint "invoices_aircraft_id_fkey";

alter table "public"."invoices" add constraint "invoices_category_check" CHECK ((category = ANY (ARRAY['membership'::text, 'instruction'::text]))) not valid;

alter table "public"."invoices" validate constraint "invoices_category_check";

alter table "public"."invoices" add constraint "invoices_created_by_cfi_id_fkey" FOREIGN KEY (created_by_cfi_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_created_by_cfi_id_fkey";

alter table "public"."invoices" add constraint "invoices_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES user_profiles(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_owner_id_fkey";

alter table "public"."maintenance" add constraint "maintenance_aircraft_id_fkey" FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) not valid;

alter table "public"."maintenance" validate constraint "maintenance_aircraft_id_fkey";

alter table "public"."membership_quotes" add constraint "membership_quotes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL not valid;

alter table "public"."membership_quotes" validate constraint "membership_quotes_user_id_fkey";

alter table "public"."membership_tiers" add constraint "membership_tiers_name_key" UNIQUE using index "membership_tiers_name_key";

alter table "public"."memberships" add constraint "memberships_aircraft_id_fkey" FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) not valid;

alter table "public"."memberships" validate constraint "memberships_aircraft_id_fkey";

alter table "public"."memberships" add constraint "memberships_one_active_per_aircraft" UNIQUE using index "memberships_one_active_per_aircraft" DEFERRABLE;

alter table "public"."memberships" add constraint "memberships_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES user_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."memberships" validate constraint "memberships_owner_id_fkey";

alter table "public"."memberships" add constraint "memberships_tier_id_fkey" FOREIGN KEY (tier_id) REFERENCES membership_tiers(id) ON DELETE SET NULL not valid;

alter table "public"."memberships" validate constraint "memberships_tier_id_fkey";

alter table "public"."notifications" add constraint "notifications_type_check" CHECK ((type = ANY (ARRAY['service_request'::text, 'maintenance_due'::text, 'invoice'::text, 'client_joined'::text, 'flight_log'::text, 'general'::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_type_check";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."onboarding_data" add constraint "onboarding_data_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."onboarding_data" validate constraint "onboarding_data_user_id_fkey";

alter table "public"."onboarding_data" add constraint "onboarding_data_user_id_key" UNIQUE using index "onboarding_data_user_id_key";

alter table "public"."pricing_classes" add constraint "pricing_classes_slug_key" UNIQUE using index "pricing_classes_slug_key";

alter table "public"."pricing_locations" add constraint "pricing_locations_slug_key" UNIQUE using index "pricing_locations_slug_key";

alter table "public"."service_credits" add constraint "service_credits_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES user_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."service_credits" validate constraint "service_credits_owner_id_fkey";

alter table "public"."service_requests" add constraint "chk_sr_airport_icao" CHECK (((airport IS NULL) OR ((length(airport) >= 3) AND (length(airport) <= 4)))) not valid;

alter table "public"."service_requests" validate constraint "chk_sr_airport_icao";

alter table "public"."service_requests" add constraint "service_requests_aircraft_id_fkey" FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE RESTRICT not valid;

alter table "public"."service_requests" validate constraint "service_requests_aircraft_id_fkey";

alter table "public"."service_requests" add constraint "service_requests_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES user_profiles(id) not valid;

alter table "public"."service_requests" validate constraint "service_requests_assigned_to_fkey";

alter table "public"."service_requests" add constraint "service_requests_fuel_grade_check" CHECK ((fuel_grade = ANY (ARRAY['100LL'::text, 'Jet-A'::text, 'Jet-A+'::text, 'MOGAS'::text]))) not valid;

alter table "public"."service_requests" validate constraint "service_requests_fuel_grade_check";

alter table "public"."service_requests" add constraint "service_requests_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))) not valid;

alter table "public"."service_requests" validate constraint "service_requests_priority_check";

alter table "public"."service_requests" add constraint "service_requests_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."service_requests" validate constraint "service_requests_status_check";

alter table "public"."service_requests" add constraint "service_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."service_requests" validate constraint "service_requests_user_id_fkey";

alter table "public"."service_tasks" add constraint "service_tasks_aircraft_id_fkey" FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE CASCADE not valid;

alter table "public"."service_tasks" validate constraint "service_tasks_aircraft_id_fkey";

alter table "public"."service_tasks" add constraint "service_tasks_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."service_tasks" validate constraint "service_tasks_assigned_to_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_owner_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.afs_enforce_capacity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  max_usable numeric(6,1);
BEGIN
  SELECT a.usable_fuel_gal INTO max_usable
  FROM public.aircraft a
  WHERE a.id = NEW.aircraft_id;

  IF max_usable IS NOT NULL AND NEW.gallons_onboard > max_usable THEN
    RAISE EXCEPTION 'gallons_onboard (%.1f) exceeds aircraft usable fuel (%.1f) for aircraft %',
      NEW.gallons_onboard, max_usable, NEW.aircraft_id;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.after_fuel_log_create_charge()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  owner uuid;
  rate numeric;
  order_directive text;
BEGIN
  SELECT a.owner_id INTO owner FROM public.aircraft a WHERE a.id = NEW.aircraft_id;
  SELECT default_fuel_rate INTO rate FROM public.settings LIMIT 1;

  SELECT fo.applied_directive INTO order_directive
  FROM public.fuel_orders fo
  WHERE fo.aircraft_id = NEW.aircraft_id
    AND fo.requested_at > now() - interval '6 hours'
  ORDER BY fo.requested_at DESC
  LIMIT 1;

  IF order_directive = 'FA_CARD_REBILL_CLIENT' THEN
    INSERT INTO public.fuel_charges(
      fuel_log_id, aircraft_id, client_id, gallons, unit_price, paid_via, payment_status
    ) VALUES (
      NEW.id, NEW.aircraft_id, owner, NEW.quantity, COALESCE(rate,0), 'FA_CORP_CARD', 'pending'
    );
  ELSIF order_directive = 'DIRECT_TO_FBO_CLIENT_CARD' THEN
    INSERT INTO public.fuel_charges(
      fuel_log_id, aircraft_id, client_id, gallons, unit_price, paid_via, payment_status
    ) VALUES (
      NEW.id, NEW.aircraft_id, owner, NEW.quantity, COALESCE(rate,0), 'CLIENT_CARD_ON_FILE', 'external_paid'
    );
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.after_fuel_log_update_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  full_gal numeric(6,1);
  prev_gal numeric(6,1);
  new_gal numeric(6,1);
BEGIN
  SELECT a.usable_fuel_gal INTO full_gal FROM public.aircraft a WHERE a.id = NEW.aircraft_id;
  SELECT v.gallons_onboard INTO prev_gal FROM public.v_aircraft_fuel_latest v WHERE v.aircraft_id = NEW.aircraft_id;
  IF prev_gal IS NULL THEN prev_gal := 0; END IF;
  new_gal := LEAST(prev_gal + NEW.quantity, COALESCE(full_gal, prev_gal + NEW.quantity));
  INSERT INTO public.aircraft_fuel_status (aircraft_id, gallons_onboard, method, notes)
  VALUES (NEW.aircraft_id, new_gal, 'fuel_log', 'Auto from fueling');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.assign_default_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.user_profiles
  SET role = 'owner'
  WHERE id = NEW.id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_view_all_profiles()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  -- Use the SECURITY DEFINER function to avoid recursion
  RETURN get_current_user_role() IN ('admin', 'staff', 'founder', 'cfi');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_instruction_invoice(p_owner_id uuid, p_aircraft_id uuid, p_description text, p_hours numeric, p_rate_cents integer, p_cfi_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_user_role TEXT;
  v_aircraft_owner_id UUID;
BEGIN
  -- Verify the caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Verify the CFI ID matches the authenticated user (or user is admin/founder)
  IF p_cfi_id != auth.uid() THEN
    -- Check if user is admin or founder
    SELECT role INTO v_user_role
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    IF v_user_role NOT IN ('admin', 'founder') THEN
      RAISE EXCEPTION 'Unauthorized: CFI ID does not match authenticated user';
    END IF;
  END IF;
  
  -- Verify the caller has CFI role
  SELECT role INTO v_user_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  IF v_user_role NOT IN ('admin', 'staff', 'cfi', 'founder') THEN
    RAISE EXCEPTION 'Unauthorized: User must be CFI, staff, admin, or founder';
  END IF;
  
  -- If aircraft_id is provided, verify owner matches
  IF p_aircraft_id IS NOT NULL THEN
    SELECT owner_id INTO v_aircraft_owner_id
    FROM public.aircraft
    WHERE id = p_aircraft_id;
    
    IF v_aircraft_owner_id IS NULL THEN
      RAISE EXCEPTION 'Aircraft not found';
    END IF;
    
    IF v_aircraft_owner_id != p_owner_id THEN
      RAISE EXCEPTION 'Aircraft owner does not match invoice owner';
    END IF;
  END IF;
  
  -- Generate invoice number (INV-YYYYMMDD-XXXXX)
  v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  
  -- Create the invoice
  INSERT INTO public.invoices (
    owner_id,
    aircraft_id,  -- Now can be NULL
    invoice_number,
    amount,
    status,
    category,
    created_by_cfi_id,
    due_date
  ) VALUES (
    p_owner_id,
    p_aircraft_id,  -- Can be NULL
    v_invoice_number,
    (p_hours * p_rate_cents / 100)::DECIMAL(10, 2),
    'draft',
    'instruction',
    p_cfi_id,
    CURRENT_DATE + INTERVAL '30 days'
  )
  RETURNING id INTO v_invoice_id;
  
  -- Create invoice line item
  INSERT INTO public.invoice_lines (
    invoice_id,
    description,
    quantity,
    unit_cents
  ) VALUES (
    v_invoice_id,
    p_description,
    p_hours,
    p_rate_cents
  );
  
  -- Return the invoice ID
  RETURN v_invoice_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_type text, p_title text, p_message text, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.debug_user_profile_role_value()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
BEGIN
  EXECUTE sql_query;
  RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM, 'detail', SQLSTATE);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.finalize_invoice(p_invoice_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_owner_id UUID;
  v_status TEXT;
BEGIN
  -- Get invoice details
  SELECT owner_id, status INTO v_owner_id, v_status
  FROM public.invoices
  WHERE id = p_invoice_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;
  
  -- Check authorization
  IF NOT (
    -- Owner can finalize their own invoice
    v_owner_id = auth.uid() OR
    -- Or user is CFI who created it
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE id = p_invoice_id AND created_by_cfi_id = auth.uid()
    ) OR
    -- Or user is admin/staff/founder
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff', 'founder')
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized to finalize this invoice';
  END IF;
  
  -- Only draft invoices can be finalized
  IF v_status != 'draft' THEN
    RAISE EXCEPTION 'Only draft invoices can be finalized';
  END IF;
  
  -- Update status to sent
  UPDATE public.invoices
  SET status = 'sent',
      updated_at = NOW()
  WHERE id = p_invoice_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fuel_logs_set_type()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  SELECT a.fuel_type INTO NEW.fuel_type
  FROM public.aircraft a
  WHERE a.id = NEW.aircraft_id;
  IF NEW.fuel_type IS NULL THEN
    RAISE EXCEPTION 'Aircraft % has no fuel_type', NEW.aircraft_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fuel_orders_apply_directive()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.applied_fbo_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT fa.directive INTO NEW.applied_directive
  FROM public.fuel_authorizations fa
  WHERE fa.aircraft_id = NEW.aircraft_id
    AND fa.fbo_id = NEW.applied_fbo_id
    AND fa.active = true
  LIMIT 1;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fuel_orders_compute()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  full_gal numeric(6,1);
  tabs_gal numeric(6,1);
  current_gal numeric(6,1);
BEGIN
  SELECT a.fuel_type, a.usable_fuel_gal, a.tabs_fuel_gal
    INTO NEW.fuel_type, full_gal, tabs_gal
  FROM public.aircraft a WHERE a.id = NEW.aircraft_id;

  IF NEW.fuel_type IS NULL OR full_gal IS NULL OR tabs_gal IS NULL THEN
    RAISE EXCEPTION 'Aircraft % missing fuel_type/usable/tabs', NEW.aircraft_id;
  END IF;

  SELECT v.gallons_onboard INTO current_gal FROM public.v_aircraft_fuel_latest v WHERE v.aircraft_id = NEW.aircraft_id;
  IF current_gal IS NULL THEN current_gal := 0; END IF;

  NEW.snapshot_gal_onboard := current_gal;

  IF NEW.target = 'ADD_QUANTITY' THEN
    IF NEW.add_quantity_gal IS NULL OR NEW.add_quantity_gal <= 0 THEN
      RAISE EXCEPTION 'add_quantity_gal must be > 0';
    END IF;
    NEW.computed_add_gal := LEAST(NEW.add_quantity_gal, GREATEST(full_gal - current_gal, 0));

  ELSIF NEW.target = 'FILL_TO_TABS' THEN
    NEW.computed_add_gal := GREATEST(tabs_gal - current_gal, 0);

  ELSIF NEW.target = 'FILL_TO_TABS_PLUS' THEN
    IF NEW.tabs_plus_gal IS NULL OR NEW.tabs_plus_gal < 0 THEN
      RAISE EXCEPTION 'tabs_plus_gal must be >= 0';
    END IF;
    NEW.computed_add_gal := GREATEST(LEAST(tabs_gal + NEW.tabs_plus_gal, full_gal) - current_gal, 0);

  ELSIF NEW.target = 'FILL_TO_FULL' THEN
    NEW.computed_add_gal := GREATEST(full_gal - current_gal, 0);
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_schedule_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- This will be picked up by the backend to sync with Google Calendar
  PERFORM pg_notify('schedule_change', json_build_object(
    'operation', TG_OP,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
  )::text);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_service_request_created()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Notify staff/ops about new service request
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  SELECT 
    up.id,
    'service_request',
    'New Service Request',
    'A new service request has been submitted' || 
    CASE 
      WHEN NEW.aircraft_id IS NOT NULL THEN ' for aircraft ' || a.tail_number
      ELSE ''
    END,
    jsonb_build_object(
      'service_request_id', NEW.id,
      'type', NEW.type
    )
  FROM public.user_profiles up
  LEFT JOIN public.aircraft a ON a.id = NEW.aircraft_id
  WHERE up.role IN ('admin', 'founder', 'ops', 'cfi', 'staff');
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_membership_quotes()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.membership_monthly_quotes;
$function$
;

CREATE OR REPLACE FUNCTION public.set_fuel_snapshot(p_aircraft uuid, p_gal numeric, p_method fuel_status_method DEFAULT 'manual'::fuel_status_method, p_notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.aircraft_fuel_status(aircraft_id, gallons_onboard, method, notes)
  VALUES (p_aircraft, GREATEST(p_gal,0), p_method, p_notes);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

create or replace view "public"."v_memberships" as  SELECT m.id,
    m.owner_id,
    m.tier,
    m.start_date,
    m.end_date,
    m.is_active AS active,
    m.created_at,
    m.updated_at,
    m.tier_id,
    t.name AS tier_name,
    t.base_price
   FROM (memberships m
     LEFT JOIN membership_tiers t ON ((t.id = m.tier_id)));


create or replace view "public"."v_owner_aircraft" as  SELECT id,
    tail_number,
    model,
    owner_id,
    base_location,
    status,
    created_at,
    updated_at,
    hobbs_hours AS hobbs_time,
    tach_hours AS tach_time
   FROM aircraft;


create or replace view "public"."v_service_requests" as  SELECT r.id,
    r.user_id,
    r.aircraft_id,
    r.service_type,
    r.description,
    r.priority,
    r.status,
    r.created_at,
    r.updated_at,
    r.airport,
    r.service_id,
    r.is_extra_charge,
    r.credits_used,
    r.requested_departure,
    r.fuel_grade,
    r.fuel_quantity,
    r.cabin_provisioning,
    r.o2_topoff,
    r.tks_topoff,
    r.gpu_required,
    r.hangar_pullout,
    a.tail_number,
    a.base_location,
    p.full_name AS requester_name
   FROM ((service_requests r
     LEFT JOIN aircraft a ON ((a.id = r.aircraft_id)))
     LEFT JOIN user_profiles p ON ((p.id = r.user_id)));


grant delete on table "public"."aircraft" to "anon";

grant insert on table "public"."aircraft" to "anon";

grant references on table "public"."aircraft" to "anon";

grant select on table "public"."aircraft" to "anon";

grant trigger on table "public"."aircraft" to "anon";

grant truncate on table "public"."aircraft" to "anon";

grant update on table "public"."aircraft" to "anon";

grant delete on table "public"."aircraft" to "authenticated";

grant insert on table "public"."aircraft" to "authenticated";

grant references on table "public"."aircraft" to "authenticated";

grant select on table "public"."aircraft" to "authenticated";

grant trigger on table "public"."aircraft" to "authenticated";

grant truncate on table "public"."aircraft" to "authenticated";

grant update on table "public"."aircraft" to "authenticated";

grant delete on table "public"."aircraft" to "service_role";

grant insert on table "public"."aircraft" to "service_role";

grant references on table "public"."aircraft" to "service_role";

grant select on table "public"."aircraft" to "service_role";

grant trigger on table "public"."aircraft" to "service_role";

grant truncate on table "public"."aircraft" to "service_role";

grant update on table "public"."aircraft" to "service_role";

grant delete on table "public"."cfi_schedule" to "anon";

grant insert on table "public"."cfi_schedule" to "anon";

grant references on table "public"."cfi_schedule" to "anon";

grant select on table "public"."cfi_schedule" to "anon";

grant trigger on table "public"."cfi_schedule" to "anon";

grant truncate on table "public"."cfi_schedule" to "anon";

grant update on table "public"."cfi_schedule" to "anon";

grant delete on table "public"."cfi_schedule" to "authenticated";

grant insert on table "public"."cfi_schedule" to "authenticated";

grant references on table "public"."cfi_schedule" to "authenticated";

grant select on table "public"."cfi_schedule" to "authenticated";

grant trigger on table "public"."cfi_schedule" to "authenticated";

grant truncate on table "public"."cfi_schedule" to "authenticated";

grant update on table "public"."cfi_schedule" to "authenticated";

grant delete on table "public"."cfi_schedule" to "service_role";

grant insert on table "public"."cfi_schedule" to "service_role";

grant references on table "public"."cfi_schedule" to "service_role";

grant select on table "public"."cfi_schedule" to "service_role";

grant trigger on table "public"."cfi_schedule" to "service_role";

grant truncate on table "public"."cfi_schedule" to "service_role";

grant update on table "public"."cfi_schedule" to "service_role";

grant delete on table "public"."client_billing_profiles" to "anon";

grant insert on table "public"."client_billing_profiles" to "anon";

grant references on table "public"."client_billing_profiles" to "anon";

grant select on table "public"."client_billing_profiles" to "anon";

grant trigger on table "public"."client_billing_profiles" to "anon";

grant truncate on table "public"."client_billing_profiles" to "anon";

grant update on table "public"."client_billing_profiles" to "anon";

grant delete on table "public"."client_billing_profiles" to "authenticated";

grant insert on table "public"."client_billing_profiles" to "authenticated";

grant references on table "public"."client_billing_profiles" to "authenticated";

grant select on table "public"."client_billing_profiles" to "authenticated";

grant trigger on table "public"."client_billing_profiles" to "authenticated";

grant truncate on table "public"."client_billing_profiles" to "authenticated";

grant update on table "public"."client_billing_profiles" to "authenticated";

grant delete on table "public"."client_billing_profiles" to "service_role";

grant insert on table "public"."client_billing_profiles" to "service_role";

grant references on table "public"."client_billing_profiles" to "service_role";

grant select on table "public"."client_billing_profiles" to "service_role";

grant trigger on table "public"."client_billing_profiles" to "service_role";

grant truncate on table "public"."client_billing_profiles" to "service_role";

grant update on table "public"."client_billing_profiles" to "service_role";

grant delete on table "public"."consumable_events" to "anon";

grant insert on table "public"."consumable_events" to "anon";

grant references on table "public"."consumable_events" to "anon";

grant select on table "public"."consumable_events" to "anon";

grant trigger on table "public"."consumable_events" to "anon";

grant truncate on table "public"."consumable_events" to "anon";

grant update on table "public"."consumable_events" to "anon";

grant delete on table "public"."consumable_events" to "authenticated";

grant insert on table "public"."consumable_events" to "authenticated";

grant references on table "public"."consumable_events" to "authenticated";

grant select on table "public"."consumable_events" to "authenticated";

grant trigger on table "public"."consumable_events" to "authenticated";

grant truncate on table "public"."consumable_events" to "authenticated";

grant update on table "public"."consumable_events" to "authenticated";

grant delete on table "public"."consumable_events" to "service_role";

grant insert on table "public"."consumable_events" to "service_role";

grant references on table "public"."consumable_events" to "service_role";

grant select on table "public"."consumable_events" to "service_role";

grant trigger on table "public"."consumable_events" to "service_role";

grant truncate on table "public"."consumable_events" to "service_role";

grant update on table "public"."consumable_events" to "service_role";

grant delete on table "public"."credit_transactions" to "anon";

grant insert on table "public"."credit_transactions" to "anon";

grant references on table "public"."credit_transactions" to "anon";

grant select on table "public"."credit_transactions" to "anon";

grant trigger on table "public"."credit_transactions" to "anon";

grant truncate on table "public"."credit_transactions" to "anon";

grant update on table "public"."credit_transactions" to "anon";

grant delete on table "public"."credit_transactions" to "authenticated";

grant insert on table "public"."credit_transactions" to "authenticated";

grant references on table "public"."credit_transactions" to "authenticated";

grant select on table "public"."credit_transactions" to "authenticated";

grant trigger on table "public"."credit_transactions" to "authenticated";

grant truncate on table "public"."credit_transactions" to "authenticated";

grant update on table "public"."credit_transactions" to "authenticated";

grant delete on table "public"."credit_transactions" to "service_role";

grant insert on table "public"."credit_transactions" to "service_role";

grant references on table "public"."credit_transactions" to "service_role";

grant select on table "public"."credit_transactions" to "service_role";

grant trigger on table "public"."credit_transactions" to "service_role";

grant truncate on table "public"."credit_transactions" to "service_role";

grant update on table "public"."credit_transactions" to "service_role";

grant delete on table "public"."email_notifications" to "anon";

grant insert on table "public"."email_notifications" to "anon";

grant references on table "public"."email_notifications" to "anon";

grant select on table "public"."email_notifications" to "anon";

grant trigger on table "public"."email_notifications" to "anon";

grant truncate on table "public"."email_notifications" to "anon";

grant update on table "public"."email_notifications" to "anon";

grant delete on table "public"."email_notifications" to "authenticated";

grant insert on table "public"."email_notifications" to "authenticated";

grant references on table "public"."email_notifications" to "authenticated";

grant select on table "public"."email_notifications" to "authenticated";

grant trigger on table "public"."email_notifications" to "authenticated";

grant truncate on table "public"."email_notifications" to "authenticated";

grant update on table "public"."email_notifications" to "authenticated";

grant delete on table "public"."email_notifications" to "service_role";

grant insert on table "public"."email_notifications" to "service_role";

grant references on table "public"."email_notifications" to "service_role";

grant select on table "public"."email_notifications" to "service_role";

grant trigger on table "public"."email_notifications" to "service_role";

grant truncate on table "public"."email_notifications" to "service_role";

grant update on table "public"."email_notifications" to "service_role";

grant delete on table "public"."flight_logs" to "anon";

grant insert on table "public"."flight_logs" to "anon";

grant references on table "public"."flight_logs" to "anon";

grant select on table "public"."flight_logs" to "anon";

grant trigger on table "public"."flight_logs" to "anon";

grant truncate on table "public"."flight_logs" to "anon";

grant update on table "public"."flight_logs" to "anon";

grant delete on table "public"."flight_logs" to "authenticated";

grant insert on table "public"."flight_logs" to "authenticated";

grant references on table "public"."flight_logs" to "authenticated";

grant select on table "public"."flight_logs" to "authenticated";

grant trigger on table "public"."flight_logs" to "authenticated";

grant truncate on table "public"."flight_logs" to "authenticated";

grant update on table "public"."flight_logs" to "authenticated";

grant delete on table "public"."flight_logs" to "service_role";

grant insert on table "public"."flight_logs" to "service_role";

grant references on table "public"."flight_logs" to "service_role";

grant select on table "public"."flight_logs" to "service_role";

grant trigger on table "public"."flight_logs" to "service_role";

grant truncate on table "public"."flight_logs" to "service_role";

grant update on table "public"."flight_logs" to "service_role";

grant delete on table "public"."fuel_records" to "anon";

grant insert on table "public"."fuel_records" to "anon";

grant references on table "public"."fuel_records" to "anon";

grant select on table "public"."fuel_records" to "anon";

grant trigger on table "public"."fuel_records" to "anon";

grant truncate on table "public"."fuel_records" to "anon";

grant update on table "public"."fuel_records" to "anon";

grant delete on table "public"."fuel_records" to "authenticated";

grant insert on table "public"."fuel_records" to "authenticated";

grant references on table "public"."fuel_records" to "authenticated";

grant select on table "public"."fuel_records" to "authenticated";

grant trigger on table "public"."fuel_records" to "authenticated";

grant truncate on table "public"."fuel_records" to "authenticated";

grant update on table "public"."fuel_records" to "authenticated";

grant delete on table "public"."fuel_records" to "service_role";

grant insert on table "public"."fuel_records" to "service_role";

grant references on table "public"."fuel_records" to "service_role";

grant select on table "public"."fuel_records" to "service_role";

grant trigger on table "public"."fuel_records" to "service_role";

grant truncate on table "public"."fuel_records" to "service_role";

grant update on table "public"."fuel_records" to "service_role";

grant delete on table "public"."google_calendar_tokens" to "anon";

grant insert on table "public"."google_calendar_tokens" to "anon";

grant references on table "public"."google_calendar_tokens" to "anon";

grant select on table "public"."google_calendar_tokens" to "anon";

grant trigger on table "public"."google_calendar_tokens" to "anon";

grant truncate on table "public"."google_calendar_tokens" to "anon";

grant update on table "public"."google_calendar_tokens" to "anon";

grant delete on table "public"."google_calendar_tokens" to "authenticated";

grant insert on table "public"."google_calendar_tokens" to "authenticated";

grant references on table "public"."google_calendar_tokens" to "authenticated";

grant select on table "public"."google_calendar_tokens" to "authenticated";

grant trigger on table "public"."google_calendar_tokens" to "authenticated";

grant truncate on table "public"."google_calendar_tokens" to "authenticated";

grant update on table "public"."google_calendar_tokens" to "authenticated";

grant delete on table "public"."google_calendar_tokens" to "service_role";

grant insert on table "public"."google_calendar_tokens" to "service_role";

grant references on table "public"."google_calendar_tokens" to "service_role";

grant select on table "public"."google_calendar_tokens" to "service_role";

grant trigger on table "public"."google_calendar_tokens" to "service_role";

grant truncate on table "public"."google_calendar_tokens" to "service_role";

grant update on table "public"."google_calendar_tokens" to "service_role";

grant delete on table "public"."hangar_reservations" to "anon";

grant insert on table "public"."hangar_reservations" to "anon";

grant references on table "public"."hangar_reservations" to "anon";

grant select on table "public"."hangar_reservations" to "anon";

grant trigger on table "public"."hangar_reservations" to "anon";

grant truncate on table "public"."hangar_reservations" to "anon";

grant update on table "public"."hangar_reservations" to "anon";

grant delete on table "public"."hangar_reservations" to "authenticated";

grant insert on table "public"."hangar_reservations" to "authenticated";

grant references on table "public"."hangar_reservations" to "authenticated";

grant select on table "public"."hangar_reservations" to "authenticated";

grant trigger on table "public"."hangar_reservations" to "authenticated";

grant truncate on table "public"."hangar_reservations" to "authenticated";

grant update on table "public"."hangar_reservations" to "authenticated";

grant delete on table "public"."hangar_reservations" to "service_role";

grant insert on table "public"."hangar_reservations" to "service_role";

grant references on table "public"."hangar_reservations" to "service_role";

grant select on table "public"."hangar_reservations" to "service_role";

grant trigger on table "public"."hangar_reservations" to "service_role";

grant truncate on table "public"."hangar_reservations" to "service_role";

grant update on table "public"."hangar_reservations" to "service_role";

grant delete on table "public"."hangar_spaces" to "anon";

grant insert on table "public"."hangar_spaces" to "anon";

grant references on table "public"."hangar_spaces" to "anon";

grant select on table "public"."hangar_spaces" to "anon";

grant trigger on table "public"."hangar_spaces" to "anon";

grant truncate on table "public"."hangar_spaces" to "anon";

grant update on table "public"."hangar_spaces" to "anon";

grant delete on table "public"."hangar_spaces" to "authenticated";

grant insert on table "public"."hangar_spaces" to "authenticated";

grant references on table "public"."hangar_spaces" to "authenticated";

grant select on table "public"."hangar_spaces" to "authenticated";

grant trigger on table "public"."hangar_spaces" to "authenticated";

grant truncate on table "public"."hangar_spaces" to "authenticated";

grant update on table "public"."hangar_spaces" to "authenticated";

grant delete on table "public"."hangar_spaces" to "service_role";

grant insert on table "public"."hangar_spaces" to "service_role";

grant references on table "public"."hangar_spaces" to "service_role";

grant select on table "public"."hangar_spaces" to "service_role";

grant trigger on table "public"."hangar_spaces" to "service_role";

grant truncate on table "public"."hangar_spaces" to "service_role";

grant update on table "public"."hangar_spaces" to "service_role";

grant delete on table "public"."instruction_requests" to "anon";

grant insert on table "public"."instruction_requests" to "anon";

grant references on table "public"."instruction_requests" to "anon";

grant select on table "public"."instruction_requests" to "anon";

grant trigger on table "public"."instruction_requests" to "anon";

grant truncate on table "public"."instruction_requests" to "anon";

grant update on table "public"."instruction_requests" to "anon";

grant delete on table "public"."instruction_requests" to "authenticated";

grant insert on table "public"."instruction_requests" to "authenticated";

grant references on table "public"."instruction_requests" to "authenticated";

grant select on table "public"."instruction_requests" to "authenticated";

grant trigger on table "public"."instruction_requests" to "authenticated";

grant truncate on table "public"."instruction_requests" to "authenticated";

grant update on table "public"."instruction_requests" to "authenticated";

grant delete on table "public"."instruction_requests" to "service_role";

grant insert on table "public"."instruction_requests" to "service_role";

grant references on table "public"."instruction_requests" to "service_role";

grant select on table "public"."instruction_requests" to "service_role";

grant trigger on table "public"."instruction_requests" to "service_role";

grant truncate on table "public"."instruction_requests" to "service_role";

grant update on table "public"."instruction_requests" to "service_role";

grant delete on table "public"."invoice_lines" to "anon";

grant insert on table "public"."invoice_lines" to "anon";

grant references on table "public"."invoice_lines" to "anon";

grant select on table "public"."invoice_lines" to "anon";

grant trigger on table "public"."invoice_lines" to "anon";

grant truncate on table "public"."invoice_lines" to "anon";

grant update on table "public"."invoice_lines" to "anon";

grant delete on table "public"."invoice_lines" to "authenticated";

grant insert on table "public"."invoice_lines" to "authenticated";

grant references on table "public"."invoice_lines" to "authenticated";

grant select on table "public"."invoice_lines" to "authenticated";

grant trigger on table "public"."invoice_lines" to "authenticated";

grant truncate on table "public"."invoice_lines" to "authenticated";

grant update on table "public"."invoice_lines" to "authenticated";

grant delete on table "public"."invoice_lines" to "service_role";

grant insert on table "public"."invoice_lines" to "service_role";

grant references on table "public"."invoice_lines" to "service_role";

grant select on table "public"."invoice_lines" to "service_role";

grant trigger on table "public"."invoice_lines" to "service_role";

grant truncate on table "public"."invoice_lines" to "service_role";

grant update on table "public"."invoice_lines" to "service_role";

grant delete on table "public"."invoices" to "anon";

grant insert on table "public"."invoices" to "anon";

grant references on table "public"."invoices" to "anon";

grant select on table "public"."invoices" to "anon";

grant trigger on table "public"."invoices" to "anon";

grant truncate on table "public"."invoices" to "anon";

grant update on table "public"."invoices" to "anon";

grant delete on table "public"."invoices" to "authenticated";

grant insert on table "public"."invoices" to "authenticated";

grant references on table "public"."invoices" to "authenticated";

grant select on table "public"."invoices" to "authenticated";

grant trigger on table "public"."invoices" to "authenticated";

grant truncate on table "public"."invoices" to "authenticated";

grant update on table "public"."invoices" to "authenticated";

grant delete on table "public"."invoices" to "service_role";

grant insert on table "public"."invoices" to "service_role";

grant references on table "public"."invoices" to "service_role";

grant select on table "public"."invoices" to "service_role";

grant trigger on table "public"."invoices" to "service_role";

grant truncate on table "public"."invoices" to "service_role";

grant update on table "public"."invoices" to "service_role";

grant delete on table "public"."maintenance" to "anon";

grant insert on table "public"."maintenance" to "anon";

grant references on table "public"."maintenance" to "anon";

grant select on table "public"."maintenance" to "anon";

grant trigger on table "public"."maintenance" to "anon";

grant truncate on table "public"."maintenance" to "anon";

grant update on table "public"."maintenance" to "anon";

grant delete on table "public"."maintenance" to "authenticated";

grant insert on table "public"."maintenance" to "authenticated";

grant references on table "public"."maintenance" to "authenticated";

grant select on table "public"."maintenance" to "authenticated";

grant trigger on table "public"."maintenance" to "authenticated";

grant truncate on table "public"."maintenance" to "authenticated";

grant update on table "public"."maintenance" to "authenticated";

grant delete on table "public"."maintenance" to "service_role";

grant insert on table "public"."maintenance" to "service_role";

grant references on table "public"."maintenance" to "service_role";

grant select on table "public"."maintenance" to "service_role";

grant trigger on table "public"."maintenance" to "service_role";

grant truncate on table "public"."maintenance" to "service_role";

grant update on table "public"."maintenance" to "service_role";

grant delete on table "public"."membership_quotes" to "anon";

grant insert on table "public"."membership_quotes" to "anon";

grant references on table "public"."membership_quotes" to "anon";

grant select on table "public"."membership_quotes" to "anon";

grant trigger on table "public"."membership_quotes" to "anon";

grant truncate on table "public"."membership_quotes" to "anon";

grant update on table "public"."membership_quotes" to "anon";

grant delete on table "public"."membership_quotes" to "authenticated";

grant insert on table "public"."membership_quotes" to "authenticated";

grant references on table "public"."membership_quotes" to "authenticated";

grant select on table "public"."membership_quotes" to "authenticated";

grant trigger on table "public"."membership_quotes" to "authenticated";

grant truncate on table "public"."membership_quotes" to "authenticated";

grant update on table "public"."membership_quotes" to "authenticated";

grant delete on table "public"."membership_quotes" to "service_role";

grant insert on table "public"."membership_quotes" to "service_role";

grant references on table "public"."membership_quotes" to "service_role";

grant select on table "public"."membership_quotes" to "service_role";

grant trigger on table "public"."membership_quotes" to "service_role";

grant truncate on table "public"."membership_quotes" to "service_role";

grant update on table "public"."membership_quotes" to "service_role";

grant delete on table "public"."membership_tiers" to "anon";

grant insert on table "public"."membership_tiers" to "anon";

grant references on table "public"."membership_tiers" to "anon";

grant select on table "public"."membership_tiers" to "anon";

grant trigger on table "public"."membership_tiers" to "anon";

grant truncate on table "public"."membership_tiers" to "anon";

grant update on table "public"."membership_tiers" to "anon";

grant delete on table "public"."membership_tiers" to "authenticated";

grant insert on table "public"."membership_tiers" to "authenticated";

grant references on table "public"."membership_tiers" to "authenticated";

grant select on table "public"."membership_tiers" to "authenticated";

grant trigger on table "public"."membership_tiers" to "authenticated";

grant truncate on table "public"."membership_tiers" to "authenticated";

grant update on table "public"."membership_tiers" to "authenticated";

grant delete on table "public"."membership_tiers" to "service_role";

grant insert on table "public"."membership_tiers" to "service_role";

grant references on table "public"."membership_tiers" to "service_role";

grant select on table "public"."membership_tiers" to "service_role";

grant trigger on table "public"."membership_tiers" to "service_role";

grant truncate on table "public"."membership_tiers" to "service_role";

grant update on table "public"."membership_tiers" to "service_role";

grant delete on table "public"."memberships" to "anon";

grant insert on table "public"."memberships" to "anon";

grant references on table "public"."memberships" to "anon";

grant select on table "public"."memberships" to "anon";

grant trigger on table "public"."memberships" to "anon";

grant truncate on table "public"."memberships" to "anon";

grant update on table "public"."memberships" to "anon";

grant delete on table "public"."memberships" to "authenticated";

grant insert on table "public"."memberships" to "authenticated";

grant references on table "public"."memberships" to "authenticated";

grant select on table "public"."memberships" to "authenticated";

grant trigger on table "public"."memberships" to "authenticated";

grant truncate on table "public"."memberships" to "authenticated";

grant update on table "public"."memberships" to "authenticated";

grant delete on table "public"."memberships" to "service_role";

grant insert on table "public"."memberships" to "service_role";

grant references on table "public"."memberships" to "service_role";

grant select on table "public"."memberships" to "service_role";

grant trigger on table "public"."memberships" to "service_role";

grant truncate on table "public"."memberships" to "service_role";

grant update on table "public"."memberships" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."onboarding_data" to "anon";

grant insert on table "public"."onboarding_data" to "anon";

grant references on table "public"."onboarding_data" to "anon";

grant select on table "public"."onboarding_data" to "anon";

grant trigger on table "public"."onboarding_data" to "anon";

grant truncate on table "public"."onboarding_data" to "anon";

grant update on table "public"."onboarding_data" to "anon";

grant delete on table "public"."onboarding_data" to "authenticated";

grant insert on table "public"."onboarding_data" to "authenticated";

grant references on table "public"."onboarding_data" to "authenticated";

grant select on table "public"."onboarding_data" to "authenticated";

grant trigger on table "public"."onboarding_data" to "authenticated";

grant truncate on table "public"."onboarding_data" to "authenticated";

grant update on table "public"."onboarding_data" to "authenticated";

grant delete on table "public"."onboarding_data" to "service_role";

grant insert on table "public"."onboarding_data" to "service_role";

grant references on table "public"."onboarding_data" to "service_role";

grant select on table "public"."onboarding_data" to "service_role";

grant trigger on table "public"."onboarding_data" to "service_role";

grant truncate on table "public"."onboarding_data" to "service_role";

grant update on table "public"."onboarding_data" to "service_role";

grant delete on table "public"."pricing_classes" to "anon";

grant insert on table "public"."pricing_classes" to "anon";

grant references on table "public"."pricing_classes" to "anon";

grant select on table "public"."pricing_classes" to "anon";

grant trigger on table "public"."pricing_classes" to "anon";

grant truncate on table "public"."pricing_classes" to "anon";

grant update on table "public"."pricing_classes" to "anon";

grant delete on table "public"."pricing_classes" to "authenticated";

grant insert on table "public"."pricing_classes" to "authenticated";

grant references on table "public"."pricing_classes" to "authenticated";

grant select on table "public"."pricing_classes" to "authenticated";

grant trigger on table "public"."pricing_classes" to "authenticated";

grant truncate on table "public"."pricing_classes" to "authenticated";

grant update on table "public"."pricing_classes" to "authenticated";

grant delete on table "public"."pricing_classes" to "service_role";

grant insert on table "public"."pricing_classes" to "service_role";

grant references on table "public"."pricing_classes" to "service_role";

grant select on table "public"."pricing_classes" to "service_role";

grant trigger on table "public"."pricing_classes" to "service_role";

grant truncate on table "public"."pricing_classes" to "service_role";

grant update on table "public"."pricing_classes" to "service_role";

grant delete on table "public"."pricing_locations" to "anon";

grant insert on table "public"."pricing_locations" to "anon";

grant references on table "public"."pricing_locations" to "anon";

grant select on table "public"."pricing_locations" to "anon";

grant trigger on table "public"."pricing_locations" to "anon";

grant truncate on table "public"."pricing_locations" to "anon";

grant update on table "public"."pricing_locations" to "anon";

grant delete on table "public"."pricing_locations" to "authenticated";

grant insert on table "public"."pricing_locations" to "authenticated";

grant references on table "public"."pricing_locations" to "authenticated";

grant select on table "public"."pricing_locations" to "authenticated";

grant trigger on table "public"."pricing_locations" to "authenticated";

grant truncate on table "public"."pricing_locations" to "authenticated";

grant update on table "public"."pricing_locations" to "authenticated";

grant delete on table "public"."pricing_locations" to "service_role";

grant insert on table "public"."pricing_locations" to "service_role";

grant references on table "public"."pricing_locations" to "service_role";

grant select on table "public"."pricing_locations" to "service_role";

grant trigger on table "public"."pricing_locations" to "service_role";

grant truncate on table "public"."pricing_locations" to "service_role";

grant update on table "public"."pricing_locations" to "service_role";

grant delete on table "public"."service_credits" to "anon";

grant insert on table "public"."service_credits" to "anon";

grant references on table "public"."service_credits" to "anon";

grant select on table "public"."service_credits" to "anon";

grant trigger on table "public"."service_credits" to "anon";

grant truncate on table "public"."service_credits" to "anon";

grant update on table "public"."service_credits" to "anon";

grant delete on table "public"."service_credits" to "authenticated";

grant insert on table "public"."service_credits" to "authenticated";

grant references on table "public"."service_credits" to "authenticated";

grant select on table "public"."service_credits" to "authenticated";

grant trigger on table "public"."service_credits" to "authenticated";

grant truncate on table "public"."service_credits" to "authenticated";

grant update on table "public"."service_credits" to "authenticated";

grant delete on table "public"."service_credits" to "service_role";

grant insert on table "public"."service_credits" to "service_role";

grant references on table "public"."service_credits" to "service_role";

grant select on table "public"."service_credits" to "service_role";

grant trigger on table "public"."service_credits" to "service_role";

grant truncate on table "public"."service_credits" to "service_role";

grant update on table "public"."service_credits" to "service_role";

grant delete on table "public"."service_requests" to "anon";

grant insert on table "public"."service_requests" to "anon";

grant references on table "public"."service_requests" to "anon";

grant select on table "public"."service_requests" to "anon";

grant trigger on table "public"."service_requests" to "anon";

grant truncate on table "public"."service_requests" to "anon";

grant update on table "public"."service_requests" to "anon";

grant delete on table "public"."service_requests" to "authenticated";

grant insert on table "public"."service_requests" to "authenticated";

grant references on table "public"."service_requests" to "authenticated";

grant select on table "public"."service_requests" to "authenticated";

grant trigger on table "public"."service_requests" to "authenticated";

grant truncate on table "public"."service_requests" to "authenticated";

grant update on table "public"."service_requests" to "authenticated";

grant delete on table "public"."service_requests" to "service_role";

grant insert on table "public"."service_requests" to "service_role";

grant references on table "public"."service_requests" to "service_role";

grant select on table "public"."service_requests" to "service_role";

grant trigger on table "public"."service_requests" to "service_role";

grant truncate on table "public"."service_requests" to "service_role";

grant update on table "public"."service_requests" to "service_role";

grant delete on table "public"."service_tasks" to "anon";

grant insert on table "public"."service_tasks" to "anon";

grant references on table "public"."service_tasks" to "anon";

grant select on table "public"."service_tasks" to "anon";

grant trigger on table "public"."service_tasks" to "anon";

grant truncate on table "public"."service_tasks" to "anon";

grant update on table "public"."service_tasks" to "anon";

grant delete on table "public"."service_tasks" to "authenticated";

grant insert on table "public"."service_tasks" to "authenticated";

grant references on table "public"."service_tasks" to "authenticated";

grant select on table "public"."service_tasks" to "authenticated";

grant trigger on table "public"."service_tasks" to "authenticated";

grant truncate on table "public"."service_tasks" to "authenticated";

grant update on table "public"."service_tasks" to "authenticated";

grant delete on table "public"."service_tasks" to "service_role";

grant insert on table "public"."service_tasks" to "service_role";

grant references on table "public"."service_tasks" to "service_role";

grant select on table "public"."service_tasks" to "service_role";

grant trigger on table "public"."service_tasks" to "service_role";

grant truncate on table "public"."service_tasks" to "service_role";

grant update on table "public"."service_tasks" to "service_role";

grant delete on table "public"."settings" to "anon";

grant insert on table "public"."settings" to "anon";

grant references on table "public"."settings" to "anon";

grant select on table "public"."settings" to "anon";

grant trigger on table "public"."settings" to "anon";

grant truncate on table "public"."settings" to "anon";

grant update on table "public"."settings" to "anon";

grant delete on table "public"."settings" to "authenticated";

grant insert on table "public"."settings" to "authenticated";

grant references on table "public"."settings" to "authenticated";

grant select on table "public"."settings" to "authenticated";

grant trigger on table "public"."settings" to "authenticated";

grant truncate on table "public"."settings" to "authenticated";

grant update on table "public"."settings" to "authenticated";

grant delete on table "public"."settings" to "service_role";

grant insert on table "public"."settings" to "service_role";

grant references on table "public"."settings" to "service_role";

grant select on table "public"."settings" to "service_role";

grant trigger on table "public"."settings" to "service_role";

grant truncate on table "public"."settings" to "service_role";

grant update on table "public"."settings" to "service_role";

grant delete on table "public"."settings_pricing_assumptions" to "anon";

grant insert on table "public"."settings_pricing_assumptions" to "anon";

grant references on table "public"."settings_pricing_assumptions" to "anon";

grant select on table "public"."settings_pricing_assumptions" to "anon";

grant trigger on table "public"."settings_pricing_assumptions" to "anon";

grant truncate on table "public"."settings_pricing_assumptions" to "anon";

grant update on table "public"."settings_pricing_assumptions" to "anon";

grant delete on table "public"."settings_pricing_assumptions" to "authenticated";

grant insert on table "public"."settings_pricing_assumptions" to "authenticated";

grant references on table "public"."settings_pricing_assumptions" to "authenticated";

grant select on table "public"."settings_pricing_assumptions" to "authenticated";

grant trigger on table "public"."settings_pricing_assumptions" to "authenticated";

grant truncate on table "public"."settings_pricing_assumptions" to "authenticated";

grant update on table "public"."settings_pricing_assumptions" to "authenticated";

grant delete on table "public"."settings_pricing_assumptions" to "service_role";

grant insert on table "public"."settings_pricing_assumptions" to "service_role";

grant references on table "public"."settings_pricing_assumptions" to "service_role";

grant select on table "public"."settings_pricing_assumptions" to "service_role";

grant trigger on table "public"."settings_pricing_assumptions" to "service_role";

grant truncate on table "public"."settings_pricing_assumptions" to "service_role";

grant update on table "public"."settings_pricing_assumptions" to "service_role";

grant delete on table "public"."support_tickets" to "anon";

grant insert on table "public"."support_tickets" to "anon";

grant references on table "public"."support_tickets" to "anon";

grant select on table "public"."support_tickets" to "anon";

grant trigger on table "public"."support_tickets" to "anon";

grant truncate on table "public"."support_tickets" to "anon";

grant update on table "public"."support_tickets" to "anon";

grant delete on table "public"."support_tickets" to "authenticated";

grant insert on table "public"."support_tickets" to "authenticated";

grant references on table "public"."support_tickets" to "authenticated";

grant select on table "public"."support_tickets" to "authenticated";

grant trigger on table "public"."support_tickets" to "authenticated";

grant truncate on table "public"."support_tickets" to "authenticated";

grant update on table "public"."support_tickets" to "authenticated";

grant delete on table "public"."support_tickets" to "service_role";

grant insert on table "public"."support_tickets" to "service_role";

grant references on table "public"."support_tickets" to "service_role";

grant select on table "public"."support_tickets" to "service_role";

grant trigger on table "public"."support_tickets" to "service_role";

grant truncate on table "public"."support_tickets" to "service_role";

grant update on table "public"."support_tickets" to "service_role";

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant references on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant trigger on table "public"."user_profiles" to "anon";

grant truncate on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant references on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant trigger on table "public"."user_profiles" to "authenticated";

grant truncate on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant references on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant trigger on table "public"."user_profiles" to "service_role";

grant truncate on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";

create policy "Admins can delete aircraft"
on "public"."aircraft"
as permissive
for delete
to public
using ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'founder'::user_role])));


create policy "Admins can insert aircraft"
on "public"."aircraft"
as permissive
for insert
to public
with check (((owner_id = auth.uid()) OR (( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'founder'::user_role]))));


create policy "Admins can update any aircraft"
on "public"."aircraft"
as permissive
for update
to public
using (((owner_id = auth.uid()) OR (( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'founder'::user_role]))))
with check (((owner_id = auth.uid()) OR (( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'founder'::user_role]))));


create policy "Owners can view own aircraft"
on "public"."aircraft"
as permissive
for select
to public
using (((owner_id = auth.uid()) OR (( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role]))));


create policy "Owners can view their aircraft"
on "public"."aircraft"
as permissive
for select
to public
using ((auth.uid() = owner_id));


create policy "owner can select their aircraft"
on "public"."aircraft"
as permissive
for select
to public
using ((owner_id = auth.uid()));


create policy "owners can insert their aircraft"
on "public"."aircraft"
as permissive
for insert
to public
with check ((owner_id = auth.uid()));


create policy "Owners can view available slots"
on "public"."cfi_schedule"
as permissive
for select
to public
using (((status = 'available'::text) OR (owner_id = auth.uid())));


create policy "Admins can delete consumable events"
on "public"."consumable_events"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'founder'::user_role]))))));


create policy "Admins can insert consumable events"
on "public"."consumable_events"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role]))))));


create policy "Admins can update consumable events"
on "public"."consumable_events"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role]))))));


create policy "Aircraft owners can view consumable events"
on "public"."consumable_events"
as permissive
for select
to public
using (((EXISTS ( SELECT 1
   FROM aircraft
  WHERE ((aircraft.id = consumable_events.aircraft_id) AND (aircraft.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role])))))));


create policy "Staff can create transactions"
on "public"."credit_transactions"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role]))))));


create policy "Users can view own transactions"
on "public"."credit_transactions"
as permissive
for select
to public
using (((owner_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'ops'::user_role])))))));


create policy "Authenticated can view email notifications"
on "public"."email_notifications"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Admins can delete logs"
on "public"."flight_logs"
as permissive
for delete
to public
using ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'founder'::user_role])));


create policy "Owners can view aircraft logs"
on "public"."flight_logs"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM aircraft
  WHERE ((aircraft.id = flight_logs.aircraft_id) AND (aircraft.owner_id = auth.uid())))));


create policy "Pilots can insert own logs"
on "public"."flight_logs"
as permissive
for insert
to public
with check ((pilot_id = auth.uid()));


create policy "Pilots can update own unverified logs"
on "public"."flight_logs"
as permissive
for update
to public
using (((pilot_id = auth.uid()) AND (verified_by IS NULL)))
with check ((pilot_id = auth.uid()));


create policy "Pilots can view own logs"
on "public"."flight_logs"
as permissive
for select
to public
using ((pilot_id = auth.uid()));


create policy "Staff can insert any logs"
on "public"."flight_logs"
as permissive
for insert
to public
with check ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'cfi'::user_role])));


create policy "Staff can update any logs"
on "public"."flight_logs"
as permissive
for update
to public
using ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'cfi'::user_role])))
with check ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'cfi'::user_role])));


create policy "Staff can view all logs"
on "public"."flight_logs"
as permissive
for select
to public
using ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'cfi'::user_role])));


create policy "Aircraft owners can view fuel records"
on "public"."fuel_records"
as permissive
for select
to public
using (((EXISTS ( SELECT 1
   FROM aircraft
  WHERE ((aircraft.id = fuel_records.aircraft_id) AND (aircraft.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'ops'::user_role])))))));


create policy "Staff can manage fuel records"
on "public"."fuel_records"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'ops'::user_role]))))));


create policy "Users can delete own tokens"
on "public"."google_calendar_tokens"
as permissive
for delete
to public
using ((user_id = auth.uid()));


create policy "Users can insert own tokens"
on "public"."google_calendar_tokens"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "Users can update own tokens"
on "public"."google_calendar_tokens"
as permissive
for update
to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "Users can view own tokens"
on "public"."google_calendar_tokens"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "Staff can manage reservations"
on "public"."hangar_reservations"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role]))))));


create policy "Users can view own reservations"
on "public"."hangar_reservations"
as permissive
for select
to public
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'ops'::user_role])))))));


create policy "Staff can manage hangar spaces"
on "public"."hangar_spaces"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role]))))));


create policy "Staff can view all hangar spaces"
on "public"."hangar_spaces"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'ops'::user_role]))))));


create policy "Authenticated can update requests"
on "public"."instruction_requests"
as permissive
for update
to public
using ((auth.uid() IS NOT NULL))
with check ((auth.uid() IS NOT NULL));


create policy "Authenticated can view all requests"
on "public"."instruction_requests"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Students can create requests"
on "public"."instruction_requests"
as permissive
for insert
to public
with check ((student_id = auth.uid()));


create policy "Students can view own requests"
on "public"."instruction_requests"
as permissive
for select
to public
using ((student_id = auth.uid()));


create policy "Admins can manage all invoice lines"
on "public"."invoice_lines"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'founder'::user_role]))))));


create policy "CFIs and admins can insert invoice lines"
on "public"."invoice_lines"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'cfi'::user_role, 'founder'::user_role]))))));


create policy "Owners can view their invoice lines"
on "public"."invoice_lines"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM invoices
  WHERE ((invoices.id = invoice_lines.invoice_id) AND (invoices.owner_id = auth.uid())))));


create policy "Users can view invoice lines for accessible invoices"
on "public"."invoice_lines"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM invoices
  WHERE ((invoices.id = invoice_lines.invoice_id) AND ((invoices.owner_id = auth.uid()) OR (invoices.created_by_cfi_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM user_profiles
          WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role]))))))))));


create policy "Users can view their own invoice lines"
on "public"."invoice_lines"
as permissive
for select
to public
using ((invoice_id IN ( SELECT invoices.id
   FROM invoices
  WHERE (invoices.owner_id = auth.uid()))));


create policy "Admins can manage all invoices"
on "public"."invoices"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'founder'::user_role]))))));


create policy "CFIs can insert instruction invoices"
on "public"."invoices"
as permissive
for insert
to public
with check (((category = 'instruction'::text) AND (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'cfi'::user_role, 'founder'::user_role])))))));


create policy "Owners can view own invoices"
on "public"."invoices"
as permissive
for select
to public
using (((owner_id = auth.uid()) OR (created_by_cfi_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role])))))));


create policy "Owners can view their invoices"
on "public"."invoices"
as permissive
for select
to public
using ((auth.uid() = owner_id));


create policy "owner can select invoices"
on "public"."invoices"
as permissive
for select
to public
using ((owner_id = auth.uid()));


create policy "Admins can delete maintenance"
on "public"."maintenance"
as permissive
for delete
to public
using ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'founder'::user_role])));


create policy "Aircraft owners can view maintenance"
on "public"."maintenance"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM aircraft
  WHERE ((aircraft.id = maintenance.aircraft_id) AND (aircraft.owner_id = auth.uid())))));


create policy "Staff can insert maintenance"
on "public"."maintenance"
as permissive
for insert
to public
with check ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role])));


create policy "Staff can update maintenance"
on "public"."maintenance"
as permissive
for update
to public
using ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role])))
with check ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role])));


create policy "Staff can view all maintenance"
on "public"."maintenance"
as permissive
for select
to public
using ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role])));


create policy "Staff can view all quotes"
on "public"."membership_quotes"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['staff'::user_role, 'admin'::user_role, 'founder'::user_role, 'ops'::user_role]))))));


create policy "Users can create their own quotes"
on "public"."membership_quotes"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can insert own quotes"
on "public"."membership_quotes"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view own quotes"
on "public"."membership_quotes"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can view their own quotes"
on "public"."membership_quotes"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Anyone can view active tiers"
on "public"."membership_tiers"
as permissive
for select
to public
using ((is_active = true));


create policy "Owners can view their own membership"
on "public"."memberships"
as permissive
for select
to public
using ((auth.uid() = owner_id));


create policy "Users can view own memberships"
on "public"."memberships"
as permissive
for select
to public
using (((owner_id = auth.uid()) OR (( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role]))));


create policy "owner can select memberships"
on "public"."memberships"
as permissive
for select
to public
using ((owner_id = auth.uid()));


create policy "owners can insert their membership"
on "public"."memberships"
as permissive
for insert
to public
with check ((owner_id = auth.uid()));


create policy "System can create notifications"
on "public"."notifications"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'founder'::user_role, 'ops'::user_role, 'cfi'::user_role, 'staff'::user_role]))))));


create policy "Users can delete own notifications"
on "public"."notifications"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update own notifications"
on "public"."notifications"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view own notifications"
on "public"."notifications"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can insert own onboarding data"
on "public"."onboarding_data"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own onboarding data"
on "public"."onboarding_data"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view own onboarding data"
on "public"."onboarding_data"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "pricing_classes_public_read"
on "public"."pricing_classes"
as permissive
for select
to public
using (true);


create policy "pricing_locations_public_read"
on "public"."pricing_locations"
as permissive
for select
to public
using (true);


create policy "Staff can manage credits"
on "public"."service_credits"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role]))))));


create policy "Users can view own credits"
on "public"."service_credits"
as permissive
for select
to public
using (((owner_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'ops'::user_role])))))));


create policy "Admins can delete service requests"
on "public"."service_requests"
as permissive
for delete
to public
using ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'founder'::user_role])));


create policy "Staff can insert any service requests"
on "public"."service_requests"
as permissive
for insert
to public
with check ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'ops'::user_role, 'cfi'::user_role])));


create policy "Staff can update service requests"
on "public"."service_requests"
as permissive
for update
to public
using ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'ops'::user_role, 'cfi'::user_role])))
with check ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'ops'::user_role, 'cfi'::user_role])));


create policy "Staff can view all service requests"
on "public"."service_requests"
as permissive
for select
to public
using ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'ops'::user_role, 'cfi'::user_role])));


create policy "Users can create own service requests"
on "public"."service_requests"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can create service requests"
on "public"."service_requests"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "Users can create their own service requests"
on "public"."service_requests"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can insert service requests"
on "public"."service_requests"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "Users can update own service requests"
on "public"."service_requests"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can update their own service requests"
on "public"."service_requests"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own service requests"
on "public"."service_requests"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "Users can view their own service requests"
on "public"."service_requests"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "owner can select their requests"
on "public"."service_requests"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "user can insert their own requests"
on "public"."service_requests"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "Admins can delete service tasks"
on "public"."service_tasks"
as permissive
for delete
to public
using ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'founder'::user_role])));


create policy "Admins can insert service tasks"
on "public"."service_tasks"
as permissive
for insert
to public
with check ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'ops'::user_role, 'cfi'::user_role])));


create policy "Admins can update service tasks"
on "public"."service_tasks"
as permissive
for update
to public
using ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'ops'::user_role, 'cfi'::user_role])))
with check ((( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'ops'::user_role, 'cfi'::user_role])));


create policy "Anyone can view service tasks"
on "public"."service_tasks"
as permissive
for select
to public
using (((EXISTS ( SELECT 1
   FROM aircraft
  WHERE ((aircraft.id = service_tasks.aircraft_id) AND (aircraft.owner_id = auth.uid())))) OR (( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'staff'::user_role, 'founder'::user_role, 'ops'::user_role, 'cfi'::user_role]))));


create policy "Owners can view tasks for their aircraft"
on "public"."service_tasks"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM aircraft
  WHERE ((aircraft.id = service_tasks.aircraft_id) AND (aircraft.owner_id = auth.uid())))));


create policy "owner sees tasks for their aircraft"
on "public"."service_tasks"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM aircraft a
  WHERE ((a.id = service_tasks.aircraft_id) AND (a.owner_id = auth.uid())))));


create policy "owners can insert tasks for their aircraft"
on "public"."service_tasks"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM aircraft a
  WHERE ((a.id = service_tasks.aircraft_id) AND (a.owner_id = auth.uid())))));


create policy "pricing_assumptions_public_read"
on "public"."settings_pricing_assumptions"
as permissive
for select
to public
using (true);


create policy "support_tickets_owner_all"
on "public"."support_tickets"
as permissive
for all
to public
using ((owner_id = auth.uid()))
with check ((owner_id = auth.uid()));


create policy "support_tickets_owner_select"
on "public"."support_tickets"
as permissive
for select
to public
using ((owner_id = auth.uid()));


create policy "admin_all"
on "public"."user_profiles"
as permissive
for all
to postgres, service_role
using (true)
with check (true);


create policy "select_own"
on "public"."user_profiles"
as permissive
for select
to authenticated
using ((auth.uid() = id));


create policy "system_insert"
on "public"."user_profiles"
as permissive
for insert
to service_role
with check (true);


create policy "update_own"
on "public"."user_profiles"
as permissive
for update
to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));


CREATE TRIGGER trg_set_updated_at_aircraft BEFORE UPDATE ON public.aircraft FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_aircraft BEFORE UPDATE ON public.aircraft FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER notify_schedule_change_trigger AFTER INSERT OR DELETE OR UPDATE ON public.cfi_schedule FOR EACH ROW EXECUTE FUNCTION notify_schedule_change();

CREATE TRIGGER trg_updated_at_service_requests BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER support_tickets_set_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_created_assign_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION assign_default_role();

-- CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();

-- CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

-- CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

-- CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();

-- CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();

-- CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

-- CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


