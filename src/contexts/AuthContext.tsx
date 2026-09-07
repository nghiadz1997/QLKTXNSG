import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { authService } from '../services/authService';
import { studentService } from '../services/studentService';
import type { Role, Student, UserProfile } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  studentData: Student | null;
  role: Role | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<Role>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfileAndRole = async (user: FirebaseUser): Promise<Role> => {
    let userRole: Role = 'student';
    try {
      // 1. Try reading custom claim role from token
      const claimRole = await authService.getUserRoleFromToken(user);
      if (claimRole) {
        userRole = claimRole;
      }

      // 2. Read users/{uid} profile from Firestore
      let profile = await authService.getUserProfile(user.uid);

      if (!claimRole && profile?.role) {
        userRole = profile.role;
      }

      // If user is a student, fetch student record
      let student: Student | null = null;
      if (userRole === 'student') {
        student = await studentService.getStudentByUid(user.uid);
        if (!student && user.email) {
          student = await studentService.getStudentByEmail(user.email);
        }
        if (!student && profile?.studentId) {
          student = await studentService.getStudentByUid(profile.studentId);
        }
        if (!student && profile?.hssv) {
          student = await studentService.getStudentByHssv(profile.hssv);
        }
        if (student) {
          userRole = 'student';
        }
      }

      // Fallback role based on email if neither claim nor firestore has role
      if (!claimRole && !profile?.role) {
        if (user.email?.includes('admin')) userRole = 'superAdmin';
        else if (user.email?.includes('truongphong')) userRole = 'truongPhong';
        else if (user.email?.includes('manager')) userRole = 'manager';
        else userRole = 'student';
      }

      // Tự động tạo document users/{uid} trên Firestore nếu chưa có, tránh lỗi "No document to update"
      if (!profile) {
        profile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || student?.fullName || 'Người Dùng KTX',
          role: userRole,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        try {
          await authService.saveUserProfile(profile);
        } catch (e) {
          console.warn('Could not auto-save initial profile to Firestore:', e);
        }
      }

      setRole(userRole);
      setUserProfile(profile);
      setStudentData(student);
      return userRole;
    } catch (err) {
      console.error('Error fetching user details:', err);
      return userRole;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        setCurrentUser(user);
        await fetchProfileAndRole(user);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setStudentData(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (identifier: string, pass: string): Promise<Role> => {
    setLoading(true);
    try {
      const user = await authService.loginWithIdentifier(identifier, pass);
      const userRole = await fetchProfileAndRole(user);
      return userRole;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setUserProfile(null);
    setStudentData(null);
    setRole(null);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfileAndRole(currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        studentData,
        role,
        loading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
