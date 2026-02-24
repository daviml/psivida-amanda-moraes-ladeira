import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runTest() {
  try {
    console.log("Teste de Leitura na Collection de Appointments (Consultas Fechadas):");
    const querySnapshot = await getDocs(collection(db, "appointments"));
    console.log(`Tem ${querySnapshot.size} consultas agendadas.`);
    
    console.log("\nTeste de Criação (Booking) Forçada...");
    const docRef = await addDoc(collection(db, "appointments"), {
       slotId: "VXPtest123",
       userEmail: "test@terminal.com",
       date: new Date(),
       startTime: "10:00",
       endTime: "10:50",
       createdAt: new Date()
    });
    console.log(`Sucesso Absoluto! ID Criado: ${docRef.id}`);

  } catch(e) {
    console.error("ERRO DETECTADO NO BANCO: ", e);
  }
}

runTest();
