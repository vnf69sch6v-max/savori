'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    updateProfile,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, onSnapshot, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserSettings, UserStats, Subscription } from '@/types';
import { logSecurityEvent, SecurityEvents } from '@/lib/security';

interface AuthContextType {
    user: FirebaseUser | null;
    userData: User | null;
    loading: boolean;
    error: string | null;
    signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    updateUserData: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_SETTINGS: UserSettings = {
    currency: 'PLN',
    language: 'pl',
    darkMode: true,
    notifications: {
        daily: true,
        weekly: true,
        goals: true,
    },
};

const DEFAULT_STATS: UserStats = {
    totalSaved: 0,
    totalExpenses: 0,
    goalsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
};

const DEFAULT_SUBSCRIPTION: Subscription = {
    plan: 'free',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Helper to manually refetch if needed (though onSnapshot handles most cases)
    const refetchUserData = async () => {
        if (!user) return;
        // Logic handled by onSnapshot, but keeping method sig if needed for immediate forced refreshes via other means, though currently empty
    };

    // Stwórz profil użytkownika w Firestore
    const createUserProfile = async (
        firebaseUser: FirebaseUser,
        displayName?: string
    ): Promise<User> => {
        const newUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: displayName || firebaseUser.displayName || 'Użytkownik',
            photoURL: firebaseUser.photoURL || null,
            createdAt: Timestamp.now(),
            subscription: DEFAULT_SUBSCRIPTION,
            settings: DEFAULT_SETTINGS,
            stats: DEFAULT_STATS,
        };

        const batch = writeBatch(db);
        const userRef = doc(db, 'users', firebaseUser.uid);
        const publicRef = doc(db, 'public_profiles', firebaseUser.uid);

        batch.set(userRef, newUser);

        // Write safe public data
        batch.set(publicRef, {
            id: newUser.id,
            displayName: newUser.displayName,
            photoURL: newUser.photoURL,
            stats: newUser.stats,
            xp: 0, // Initialize gamification
            level: 1,
            badges: []
        });

        await batch.commit();

        return newUser;
    };

    // Obserwuj zmiany stanu autoryzacji i danych użytkownika
    useEffect(() => {
        let unsubscribeUserDoc: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Subscribe to user document changes
                const userRef = doc(db, 'users', firebaseUser.uid);
                unsubscribeUserDoc = onSnapshot(userRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data() as User;
                        setUserData(data);

                        // Self-healing: Check if public profile exists, if not create it (Migration for old users)
                        // Verify once per session to avoid spamming
                        // Self-healing: Check if public profile exists (Migration for old users)
                        // Use a session-persisted flag but check safely
                        if (!sessionStorage.getItem('public_profile_checked')) {
                            // Only check once per session load
                            sessionStorage.setItem('public_profile_checked', 'true'); // Set immediately to prevent loops

                            const publicRef = doc(db, 'public_profiles', firebaseUser.uid);
                            // We use getDoc here, but only ONCE per session.
                            getDoc(publicRef).then((publicSnap) => {
                                if (!publicSnap.exists()) {
                                    console.log('Migrating user to public_profiles...');
                                    setDoc(publicRef, {
                                        id: data.id,
                                        displayName: data.displayName,
                                        photoURL: data.photoURL,
                                        stats: data.stats || DEFAULT_STATS,
                                        xp: 0,
                                        level: 1,
                                        badges: []
                                    }, { merge: true });
                                }
                            }).catch(err => console.error("Migration check failed", err));
                        }
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error watching user data:", error);
                    setLoading(false);
                });
            } else {
                if (unsubscribeUserDoc) {
                    unsubscribeUserDoc();
                    unsubscribeUserDoc = null;
                }
                setUserData(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUserDoc) {
                unsubscribeUserDoc();
            }
        };
    }, []);

    // Apply dark mode
    useEffect(() => {
        if (userData?.settings?.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [userData?.settings?.darkMode]);

    // Logowanie email/hasło
    const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
        try {
            setError(null);
            setLoading(true);

            // Set persistence based on remember me option
            // LOCAL = persists until explicitly signed out (remember me)
            // SESSION = clears when browser/tab closes
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

            const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
            // Log security event
            await logSecurityEvent(firebaseUser.uid, SecurityEvents.login('email'));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Błąd logowania';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Rejestracja
    const signUp = async (email: string, password: string, displayName: string) => {
        try {
            setError(null);
            setLoading(true);

            const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

            // Aktualizuj profil Firebase
            await updateProfile(firebaseUser, { displayName });

            // Stwórz profil w Firestore
            const newUserData = await createUserProfile(firebaseUser, displayName);
            setUserData(newUserData);

            // Log security event
            await logSecurityEvent(firebaseUser.uid, SecurityEvents.login('email'));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Błąd rejestracji';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Logowanie przez Google
    const signInWithGoogle = async () => {
        try {
            setError(null);
            setLoading(true);

            const provider = new GoogleAuthProvider();
            const { user: firebaseUser } = await signInWithPopup(auth, provider);

            // Sprawdź czy użytkownik już istnieje
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // Nowy użytkownik - stwórz profil
                const newUserData = await createUserProfile(firebaseUser);
                setUserData(newUserData);
            } else {
                setUserData(userSnap.data() as User);
            }

            // Log security event
            await logSecurityEvent(firebaseUser.uid, SecurityEvents.login('google'));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Błąd logowania przez Google';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Wylogowanie
    const signOut = async () => {
        try {
            const uid = user?.uid;
            await firebaseSignOut(auth);
            // Log security event before clearing state
            if (uid) {
                await logSecurityEvent(uid, SecurityEvents.logout());
            }
            setUser(null);
            setUserData(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Błąd wylogowania';
            setError(message);
            throw err;
        }
    };

    // Aktualizuj dane użytkownika
    const updateUserData = async (data: Partial<User>) => {
        if (!user) return;

        try {
            const batch = writeBatch(db);
            const userRef = doc(db, 'users', user.uid);
            const publicRef = doc(db, 'public_profiles', user.uid);

            // 1. Update private doc
            batch.update(userRef, data);

            // 2. Update public doc if relevant fields changed
            // Only sync safe public fields
            const publicUpdates: any = {};
            if (data.displayName !== undefined) publicUpdates.displayName = data.displayName;
            if (data.photoURL !== undefined) publicUpdates.photoURL = data.photoURL;
            if (data.stats !== undefined) publicUpdates.stats = data.stats;

            if (Object.keys(publicUpdates).length > 0) {
                batch.set(publicRef, publicUpdates, { merge: true });
            }

            await batch.commit();

            // Dane odświeżą się same dzięki onSnapshot
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Błąd aktualizacji profilu';
            setError(message);
            throw err;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userData,
                loading,
                error,
                signIn,
                signUp,
                signInWithGoogle,
                signOut,
                updateUserData,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth musi być użyte wewnątrz AuthProvider');
    }
    return context;
}
