export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface AppointmentSlot {
  id: string;
  date: Date;
  startTime: string; // "14:00"
  endTime: string;   // "15:00"
  available: boolean;
}

export enum ServiceType {
  INDIVIDUAL = 'Psicoterapia Individual',
  COUPLE = 'Terapia de Casal',
  FAMILY = 'Terapia Familiar'
}
