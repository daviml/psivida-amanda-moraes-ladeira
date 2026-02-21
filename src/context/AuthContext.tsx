import { createContext, useContext, useState, useEffect, type ReactNode, type FC } from 'react';
import { User } from '../types';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // MOCK USER FOR DEVELOPMENT - Bypassing login
  const [user, setUser] = useState<User | null>({
    id: 'mock-user-123',
    name: 'Usuário Teste',
    email: 'teste@exemplo.com',
    image: 'https://ui-avatars.com/api/?name=Usuario+Teste&background=0D8ABC&color=fff'
  });
  const [isLoading, setIsLoading] = useState(false);

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
  //     if (firebaseUser) {
  //       setUser({
  //         id: firebaseUser.uid,
  //         name: firebaseUser.displayName || 'Usuário',
  //         email: firebaseUser.email || '',
  //         image: firebaseUser.photoURL || undefined
  //       });
  //     } else {
  //       setUser(null);
  //     }
  //     setIsLoading(false);
  //   });

  //   return () => unsubscribe();
  // }, []);

  const login = async () => {
    setIsLoading(true);
    try {
      // await signInWithPopup(auth, googleProvider);
      // Simulate login success
      setUser({
        id: 'mock-user-123',
        name: 'Usuário Teste',
        email: 'teste@exemplo.com',
        image: 'https://ui-avatars.com/api/?name=Usuario+Teste&background=0D8ABC&color=fff'
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Login failed", error);
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};