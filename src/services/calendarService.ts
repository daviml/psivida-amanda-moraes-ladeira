import { db } from './firebase';
import { collection, getDocs, query, where, orderBy, doc, runTransaction, Timestamp, addDoc } from 'firebase/firestore';
import { AppointmentSlot } from '../types';

const SLOTS_COLLECTION = 'slots';
const APPOINTMENTS_COLLECTION = 'appointments';

export const fetchAvailableSlots = async (): Promise<AppointmentSlot[]> => {
  try {
    const now = new Date();
    const slotsRef = collection(db, SLOTS_COLLECTION);
    const q = query(
      slotsRef,
      where('available', '==', true),
      where('date', '>=', now), // Filter slots in the future
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: (data.date as Timestamp).toDate(), // Convert Firestore Timestamp to Date
        startTime: data.startTime,
        endTime: data.endTime,
        available: data.available
      } as AppointmentSlot;
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    throw error;
  }
};

export const bookAppointment = async (slotId: string, userEmail: string): Promise<boolean> => {
  try {
    await runTransaction(db, async (transaction) => {
      const slotRef = doc(db, SLOTS_COLLECTION, slotId);
      const slotDoc = await transaction.get(slotRef);

      if (!slotDoc.exists()) {
        throw new Error("Slot does not exist!");
      }

      const slotData = slotDoc.data();
      if (!slotData.available) {
        throw new Error("Slot is no longer available!");
      }

      // 1. Mark slot as unavailable
      transaction.update(slotRef, { available: false });

      // 2. Create booking record
      const appointmentRef = doc(collection(db, APPOINTMENTS_COLLECTION));
      transaction.set(appointmentRef, {
        slotId,
        userEmail,
        date: slotData.date,
        startTime: slotData.startTime,
        endTime: slotData.endTime,
        createdAt: Timestamp.now()
      });
    });

    console.log(`Booking confirmed for slot ${slotId} by ${userEmail}`);
    return true;
  } catch (error) {
    console.error("Transaction failed: ", error);
    return false;
  }
};