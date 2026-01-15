import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAK_BAw4IwJRw3eR1VLQdYv-w4LP6_eWnI",
    authDomain: "psivida-241ed.firebaseapp.com",
    projectId: "psivida-241ed",
    storageBucket: "psivida-241ed.firebasestorage.app",
    messagingSenderId: "616130336419",
    appId: "1:616130336419:web:72ba4ff77a0ebc7d705116",
    measurementId: "G-L0SCD7NP7B"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
