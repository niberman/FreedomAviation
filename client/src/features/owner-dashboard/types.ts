import { ServiceRequest, InstructionRequest, Invoice, ServiceStatus } from "@/shared/database-types";

export type FeedItemType = 'staging' | 'squawk' | 'instruction' | 'invoice';

export interface NormalizedFeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  status: ServiceStatus | string;
  date: string;
  description?: string;
  metadata: {
    amount?: number;
    priority?: string;
    requested_departure?: string;
    cfi_name?: string;
    fuel_quantity?: number;
    fuel_grade?: string;
    cabin_provisioning?: any;
    hangar_pullout?: boolean;
    [key: string]: any;
  };
  originalData: ServiceRequest | InstructionRequest | Invoice;
}

export type AircraftOperationalStatus = 'READY TO FLY' | 'MAINTENANCE' | 'GROUNDED';

export interface AircraftVitals {
  status: AircraftOperationalStatus;
  fuelLevel: number;
  location: string;
  hobbs: number;
  tach: number;
  lastServiceDate?: string;
}
