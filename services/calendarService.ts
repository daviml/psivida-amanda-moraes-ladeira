import { AppointmentSlot } from '../types';

// Helper to generate slots for the next few days
const generateMockSlots = (): AppointmentSlot[] => {
  const slots: AppointmentSlot[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Skip weekends for realism
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const times = ['09:00', '10:00', '14:00', '15:00', '16:00'];
    
    times.forEach((time, index) => {
      const [hours, minutes] = time.split(':').map(Number);
      const slotDate = new Date(date);
      slotDate.setHours(hours, minutes, 0, 0);

      slots.push({
        id: `slot-${i}-${index}`,
        date: slotDate,
        startTime: time,
        endTime: `${hours + 1}:00`,
        available: Math.random() > 0.3 // Random availability
      });
    });
  }
  return slots;
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchAvailableSlots = async (): Promise<AppointmentSlot[]> => {
  await delay(800); // Simulate network latency
  return generateMockSlots();
};

export const bookAppointment = async (slotId: string, userEmail: string): Promise<boolean> => {
  await delay(1500); // Simulate booking process
  console.log(`Booking confirmed for slot ${slotId} by ${userEmail}`);
  return true;
};