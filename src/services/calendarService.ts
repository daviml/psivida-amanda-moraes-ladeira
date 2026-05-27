import { db } from './firebase';
import { collection, getDocs, query, where, orderBy, doc, runTransaction, Timestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { AppointmentSlot, Appointment } from '../types';
import { PERMANENT_MEETING_LINK } from '../constants';

const SLOTS_COLLECTION = 'slots';
const APPOINTMENTS_COLLECTION = 'appointments';

export const fetchAvailableSlots = async (): Promise<AppointmentSlot[]> => {
  try {
    const now = new Date();
    // Subtrai as horas para que os slots criados as "12:00" do dia atual não sejam escondidos caso já passe das "12:01" 
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const slotsRef = collection(db, SLOTS_COLLECTION);
    
    // Para evitar o erro silencioso de "Missing Composite Index" no Firebase, 
    // buscamos filtrando apenas pela Data e validamos o "available == true" no forEach
    const q = query(
      slotsRef,
      where('date', '>=', startOfToday),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    
    const allFutureSlots = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: (data.date as Timestamp).toDate(),
        startTime: data.startTime,
        endTime: data.endTime,
        available: data.available
      } as AppointmentSlot;
    });

    // Retorna apenas os que de fato estão vagos e que não estão no passado
    return allFutureSlots.filter(slot => {
      if (!slot.available) return false;
      const slotStart = new Date(slot.date.getTime());
      const [hours, minutes] = slot.startTime.split(':').map(Number);
      slotStart.setHours(hours, minutes, 0, 0);
      return slotStart.getTime() > now.getTime();
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
        googleMeetLink: PERMANENT_MEETING_LINK,
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

export const createSlot = async (date: Date, startTime: string, endTime: string): Promise<string> => {
  try {
    const slotsRef = collection(db, SLOTS_COLLECTION);
    const docRef = await addDoc(slotsRef, {
      available: true,
      startTime,
      endTime,
      date: Timestamp.fromDate(date)
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating slot:", error);
    throw error;
  }
};

export const deleteSlot = async (slotId: string): Promise<void> => {
  try {
    const slotRef = doc(db, SLOTS_COLLECTION, slotId);
    await deleteDoc(slotRef);
  } catch (error) {
    console.error("Error deleting slot:", error);
    throw error;
  }
};

export const fetchAllAppointments = async (): Promise<Appointment[]> => {
  try {
    const apptsRef = collection(db, APPOINTMENTS_COLLECTION);
    // Order by date descending to see newest first
    const q = query(apptsRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        slotId: data.slotId,
        userEmail: data.userEmail,
        date: (data.date as Timestamp).toDate(),
        startTime: data.startTime,
        endTime: data.endTime,
        createdAt: (data.createdAt as Timestamp).toDate(),
        googleMeetLink: data.googleMeetLink
      } as Appointment;
    });
  } catch (error) {
    console.error("Error fetching all appointments:", error);
    throw error;
  }
};

export const fetchUserAppointments = async (userEmail: string): Promise<Appointment[]> => {
  try {
    const apptsRef = collection(db, APPOINTMENTS_COLLECTION);
    
    // Evita index composto buscando todos do usuário, pro React ordenar os dias. (A carga fica milissegundos)
    const q = query(
      apptsRef,
      where('userEmail', '==', userEmail)
    );
    const querySnapshot = await getDocs(q);
    
    const appts = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        slotId: data.slotId,
        userEmail: data.userEmail,
        date: (data.date as Timestamp).toDate(),
        startTime: data.startTime,
        endTime: data.endTime,
        createdAt: (data.createdAt as Timestamp).toDate(),
        googleMeetLink: data.googleMeetLink
      } as Appointment;
    });
    
    // Orderna por data mais recente 
    return appts.sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    throw error;
  }
};

export const cancelAppointment = async (appointmentId: string, slotId?: string): Promise<boolean> => {
  try {
    await runTransaction(db, async (transaction) => {
      const apptRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);

      // 1. All READS first
      const apptDoc = await transaction.get(apptRef);
      if (!apptDoc.exists()) {
        throw new Error("Appointment does not exist!");
      }

      let slotDoc = null;
      let slotRef = null;
      if (slotId) {
        slotRef = doc(db, SLOTS_COLLECTION, slotId);
        slotDoc = await transaction.get(slotRef);
      }

      // 2. All WRITES second
      transaction.delete(apptRef);

      if (slotId && slotRef && slotDoc && slotDoc.exists()) {
        transaction.update(slotRef, { available: true });
      }
    });

    console.log(`Cancelled appointment ${appointmentId} and freed slot ${slotId}`);
    return true;
  } catch (error) {
    console.error("Cancellation failed: ", error);
    throw error;
  }
};