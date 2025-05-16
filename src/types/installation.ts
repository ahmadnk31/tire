import { z } from "zod";

// This is the enum from your Prisma schema
export enum InstallationStatus {
  SCHEDULED = "SCHEDULED",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
  RESCHEDULED = "RESCHEDULED"
}

export enum InstallationServiceType {
  STANDARD = "STANDARD",
  PREMIUM = "PREMIUM",
  SPECIALTY = "SPECIALTY"
}

export enum PurchaseLocation {
  OUR_STORE = "OUR_STORE",
  ELSEWHERE = "ELSEWHERE"
}

// Define the installation form schema
export const InstallationFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(1, "Phone number is required"),
  vehicleMake: z.string().min(1, "Vehicle make is required"),
  vehicleModel: z.string().min(1, "Vehicle model is required"),
  vehicleYear: z.string().min(4, "Valid year is required"),
  tireSize: z.string().min(1, "Tire size is required"),
  tireQuantity: z.string().min(1, "Quantity is required"),
  purchasedFrom: z.nativeEnum(PurchaseLocation),
  serviceType: z.nativeEnum(InstallationServiceType),
  appointmentDate: z.date(),
  appointmentTime: z.string(),
  comments: z.string().optional(),
  technician: z.string().optional(),
  bay: z.string().optional(),
  basePrice: z.number(),
  status: z.nativeEnum(InstallationStatus),
});

// Define the type for form data based on the schema
export type InstallationFormData = z.infer<typeof InstallationFormSchema>;

// Installation interface
export interface Installation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  tireSize: string;
  tireQuantity: number;
  purchasedFrom: PurchaseLocation;
  serviceType: InstallationServiceType;
  status: InstallationStatus;
  appointmentDate: string;
  appointmentTime: string;
  comments?: string;
  technician?: string;
  bay?: string;
  basePrice: number;
  totalPrice: number;
  additionalServices: Array<{
    id: string;
    serviceName: string;
    price: number;
  }>;
  createdAt: string;
  updatedAt: string;
}
