drop policy "Admins can delete invoices" on "public"."invoices";

drop policy "Staff can create invoices" on "public"."invoices";

drop policy "Staff can update invoices" on "public"."invoices";

drop policy "Staff can view all invoices" on "public"."invoices";

drop policy "Owners can view own invoices" on "public"."invoices";

drop function if exists "public"."get_cfi_emails"();

alter table "public"."onboarding_data" add column "quote_generated" boolean default false;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.notify_service_request_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_request_data JSONB;
  v_aircraft_data RECORD;
  v_user_data RECORD;
  v_base_url TEXT;
BEGIN
  -- Get the base URL from environment or use default
  v_base_url := COALESCE(
    current_setting('app.base_url', true),
    'https://www.freedomaviationco.com'
  );

  -- Get aircraft details
  SELECT tail_number, make, model
  INTO v_aircraft_data
  FROM public.aircraft
  WHERE id = NEW.aircraft_id;

  -- Get user details
  SELECT full_name, email
  INTO v_user_data
  FROM public.user_profiles
  WHERE id = NEW.user_id;

  -- Build notification data
  v_request_data := jsonb_build_object(
    'request_id', NEW.id,
    'request_type', NEW.service_type,
    'aircraft_tail_number', v_aircraft_data.tail_number,
    'aircraft_make_model', v_aircraft_data.make || ' ' || v_aircraft_data.model,
    'owner_name', v_user_data.full_name,
    'owner_email', v_user_data.email,
    'priority', COALESCE(NEW.priority, 'medium'),
    'description', NEW.description,
    'airport', NEW.airport,
    'requested_departure', NEW.requested_departure,
    'dashboard_url', v_base_url || '/staff-dashboard?request=' || NEW.id,
    'created_at', NEW.created_at
  );

  -- Insert notification for ops users
  INSERT INTO public.email_notifications (
    type,
    recipient_role,
    data,
    status
  ) VALUES (
    'service_request',
    'ops',
    v_request_data,
    'pending'
  );

  -- Insert notification for staff users
  INSERT INTO public.email_notifications (
    type,
    recipient_role,
    data,
    status
  ) VALUES (
    'service_request',
    'staff',
    v_request_data,
    'pending'
  );

  -- Insert notification for founder users
  INSERT INTO public.email_notifications (
    type,
    recipient_role,
    data,
    status
  ) VALUES (
    'service_request',
    'founder',
    v_request_data,
    'pending'
  );

  RETURN NEW;
END;
$function$
;


  create policy "Admins can manage all invoices"
  on "public"."invoices"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::public.user_role, 'founder'::public.user_role]))))));



  create policy "CFIs can insert instruction invoices"
  on "public"."invoices"
  as permissive
  for insert
  to public
with check (((category = 'instruction'::text) AND (EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::public.user_role, 'staff'::public.user_role, 'cfi'::public.user_role, 'founder'::public.user_role])))))));



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



  create policy "Owners can view own invoices"
  on "public"."invoices"
  as permissive
  for select
  to public
using (((owner_id = auth.uid()) OR (created_by_cfi_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.role = ANY (ARRAY['admin'::public.user_role, 'staff'::public.user_role, 'founder'::public.user_role])))))));


drop trigger if exists "objects_delete_delete_prefix" on "storage"."objects";

drop trigger if exists "objects_insert_create_prefix" on "storage"."objects";

drop trigger if exists "objects_update_create_prefix" on "storage"."objects";

drop trigger if exists "prefixes_create_hierarchy" on "storage"."prefixes";

drop trigger if exists "prefixes_delete_hierarchy" on "storage"."prefixes";

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


