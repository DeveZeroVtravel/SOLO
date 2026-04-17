"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  updateProfile,
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  getDocs,
} from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { Task, Event } from "@/types";

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendPhoneOtp: (phone: string, recaptchaContainerId: string) => Promise<ConfirmationResult>;
  verifyPhoneOtp: (confirmation: ConfirmationResult, otp: string) => Promise<void>;
  logOut: () => Promise<void>;
  
  // Tasks CRUD
  getTasks: () => Promise<Task[]>;
  addTask: (task: Omit<Task, "id" | "userId" | "createdAt">) => Promise<string>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Events CRUD
  getEvents: () => Promise<Event[]>;
  addEvent: (event: Omit<Event, "id" | "userId" | "createdAt">) => Promise<string>;
  updateEvent: (id: string, data: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({} as FirebaseContextType);

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to remove undefined values before sending to Firestore
  const sanitizeData = (data: any) => {
    const sanitized = { ...data };
    Object.keys(sanitized).forEach((key) => {
      if (sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });
    return sanitized;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
    } catch (error) {
      console.error("Error signing up with email", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error sending password reset", error);
      throw error;
    }
  };

  const sendPhoneOtp = async (phone: string, recaptchaContainerId: string): Promise<ConfirmationResult> => {
    try {
      // Clear any existing verifier
      if ((window as any).__recaptchaVerifier) {
        (window as any).__recaptchaVerifier.clear();
      }
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: "invisible",
        callback: () => {},
      });
      (window as any).__recaptchaVerifier = verifier;
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      return result;
    } catch (error) {
      console.error("Error sending phone OTP", error);
      throw error;
    }
  };

  const verifyPhoneOtp = async (confirmation: ConfirmationResult, otp: string) => {
    try {
      await confirmation.confirm(otp);
    } catch (error) {
      console.error("Error verifying OTP", error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  };

  // --- TASKS ---
  const getTasks = async (): Promise<Task[]> => {
    if (!user) return [];
    try {
      const q = query(collection(db, "users", user.uid, "tasks"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
    } catch (error) {
      console.error("Error getting tasks", error);
      throw error;
    }
  };

  const addTask = async (task: Omit<Task, "id" | "userId" | "createdAt">): Promise<string> => {
    if (!user) throw new Error("User must be logged in to add a task");
    try {
      const sanitizedTask = sanitizeData(task);
      const docRef = await addDoc(collection(db, "users", user.uid, "tasks"), {
        ...sanitizedTask,
        userId: user.uid,
        createdAt: Date.now()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding task", error);
      throw error;
    }
  };

  const updateTask = async (id: string, data: Partial<Task>): Promise<void> => {
    if (!user) throw new Error("User must be logged in to update a task");
    try {
      const sanitizedData = sanitizeData(data);
      const taskRef = doc(db, "users", user.uid, "tasks", id);
      await updateDoc(taskRef, sanitizedData);
    } catch (error) {
      console.error("Error updating task", error);
      throw error;
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    if (!user) throw new Error("User must be logged in to delete a task");
    try {
      const taskRef = doc(db, "users", user.uid, "tasks", id);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error("Error deleting task", error);
      throw error;
    }
  };

  // --- EVENTS ---
  const getEvents = async (): Promise<Event[]> => {
    if (!user) return [];
    try {
      const q = query(collection(db, "users", user.uid, "events"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
    } catch (error) {
      console.error("Error getting events", error);
      throw error;
    }
  };

  const addEvent = async (event: Omit<Event, "id" | "userId" | "createdAt">): Promise<string> => {
    if (!user) throw new Error("User must be logged in to add an event");
    try {
      const sanitizedEvent = sanitizeData(event);
      const docRef = await addDoc(collection(db, "users", user.uid, "events"), {
        ...sanitizedEvent,
        userId: user.uid,
        createdAt: Date.now()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding event", error);
      throw error;
    }
  };

  const updateEvent = async (id: string, data: Partial<Event>): Promise<void> => {
    if (!user) throw new Error("User must be logged in to update an event");
    try {
      const sanitizedData = sanitizeData(data);
      const eventRef = doc(db, "users", user.uid, "events", id);
      await updateDoc(eventRef, sanitizedData);
    } catch (error) {
      console.error("Error updating event", error);
      throw error;
    }
  };

  const deleteEvent = async (id: string): Promise<void> => {
    if (!user) throw new Error("User must be logged in to delete an event");
    try {
      const eventRef = doc(db, "users", user.uid, "events", id);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error("Error deleting event", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    sendPhoneOtp,
    verifyPhoneOtp,
    logOut,
    getTasks,
    addTask,
    updateTask,
    deleteTask,
    getEvents,
    addEvent,
    updateEvent,
    deleteEvent
  };

  return (
    <FirebaseContext.Provider value={value}>
      {/* Optional: you could render a spinner here when loading == true. For now we just don't render children until auth resolves. */}
      {!loading && children}
    </FirebaseContext.Provider>
  );
};
