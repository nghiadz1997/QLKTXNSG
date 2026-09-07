import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  User as FirebaseUser,
  getIdTokenResult,
  getAuth
} from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { doc, getDoc, setDoc, deleteDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '../config/firebase';
import { studentService } from './studentService';
import type { Role, UserProfile } from '../types';

export const authService = {
  // Login supporting either Email or Student ID (HSSV)
  async loginWithIdentifier(identifier: string, password: string): Promise<FirebaseUser> {
    let emailToUse = identifier.trim();

    // If user enters student ID (e.g. 22001 or numbers without @), look up student's registered email
    if (!emailToUse.includes('@')) {
      const student = await studentService.getStudentByHssv(emailToUse);
      if (student && student.email) {
        emailToUse = student.email;
      } else {
        throw new Error('Không tìm thấy tài khoản với Mã HSSV này. Vui lòng đăng nhập bằng Email đã đăng ký.');
      }
    }

    const credential = await signInWithEmailAndPassword(auth, emailToUse, password);
    return credential.user;
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  // Read Custom Claims role from token
  async getUserRoleFromToken(user: FirebaseUser): Promise<Role | null> {
    try {
      const tokenResult = await getIdTokenResult(user, true);
      const claimRole = tokenResult.claims.role as Role | undefined;
      if (claimRole && ['student', 'manager', 'truongPhong', 'superAdmin'].includes(claimRole)) {
        return claimRole;
      }
    } catch (e) {
      console.warn('Could not read custom claims from token:', e);
    }
    return null;
  },

  // Read profile from users/{uid}
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Save/Update user profile
  async saveUserProfile(profile: UserProfile): Promise<void> {
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(docRef, profile, { merge: true });
  },

  // Tạo tài khoản THẬT trên Firebase Authentication và lưu phân quyền vào users/{uid}
  // Tự động xử lý thông minh khi email đã tồn tại (auth/email-already-in-use) bằng cách tái liên kết hoặc đồng bộ
  async createAccountInFirebaseAuth(
    email: string,
    password: string,
    displayName: string,
    role: Role,
    extraProfile?: Partial<UserProfile>
  ): Promise<{ uid: string; email: string; isLinkedExisting?: boolean }> {
    const cleanEmail = email.trim();
    let secondaryApp = getApps().find(a => a.name === 'SecondaryAdminAuth');
    if (!secondaryApp) {
      secondaryApp = initializeApp(firebaseConfig, 'SecondaryAdminAuth');
    }
    const secondaryAuth = getAuth(secondaryApp);

    let targetUid: string | null = null;
    let isLinkedExisting = false;

    try {
      // 1. Thử tạo tài khoản mới trên Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);
      targetUid = userCredential.user.uid;

      if (displayName) {
        try {
          await updateProfile(userCredential.user, { displayName: displayName.trim() });
        } catch (e) {
          console.warn('Could not update displayName:', e);
        }
      }
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        isLinkedExisting = true;
        // 2. Nếu email đã tồn tại trên Firebase Authentication:
        // Thử đăng nhập bằng mật khẩu vừa nhập trên secondaryAuth để lấy UID và xác thực
        try {
          const signInCred = await signInWithEmailAndPassword(secondaryAuth, cleanEmail, password);
          targetUid = signInCred.user.uid;

          if (displayName) {
            try {
              await updateProfile(signInCred.user, { displayName: displayName.trim() });
            } catch (e) {
              console.warn('Could not update displayName for existing user:', e);
            }
          }
        } catch (signInErr: any) {
          // 3. Nếu mật khẩu không khớp, kiểm tra xem trong Firestore `users` đã có bản ghi nào với email này chưa
          try {
            const allUsersSnap = await getDocs(collection(db, 'users'));
            const foundDoc = allUsersSnap.docs.find(d => {
              const uData = d.data();
              return uData.email && uData.email.trim().toLowerCase() === cleanEmail.toLowerCase();
            });

            if (foundDoc) {
              targetUid = foundDoc.id;
            }
          } catch (fetchErr) {
            console.warn('Error checking existing users:', fetchErr);
          }

          // Nếu vẫn không xác định được UID
          if (!targetUid) {
            const hssvHint = extraProfile?.hssv ? `${extraProfile.hssv.toLowerCase()}.sv@caothang.edu.vn` : 'email khác';
            throw new Error(
              `Email "${cleanEmail}" đã được đăng ký trước đó trên Firebase Authentication (với mật khẩu khác). ` +
              `Vui lòng chọn một email khác cho sinh viên (ví dụ: ${hssvHint}) để cấp tài khoản mới.`
            );
          }
        }
      } else {
        throw authErr;
      }
    } finally {
      try {
        await signOut(secondaryAuth);
      } catch (e) {
        // ignore
      }
    }

    if (!targetUid) {
      throw new Error('Không thể khởi tạo hoặc liên kết tài khoản.');
    }

    // 4. Lưu / Cập nhật User Profile với Role vào Firestore users collection
    const userProfile: UserProfile = {
      uid: targetUid,
      email: cleanEmail,
      displayName: displayName.trim(),
      role,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...extraProfile,
    };
    await setDoc(doc(db, 'users', targetUid), userProfile, { merge: true });

    // 5. Nếu là sinh viên, đồng bộ liên kết authUid vào hồ sơ sinh viên
    if (extraProfile?.studentId || extraProfile?.hssv) {
      try {
        const studentIdToLink = extraProfile.studentId || `student_${extraProfile.hssv}`;
        await studentService.linkStudentToAuth(studentIdToLink, targetUid, cleanEmail);
      } catch (linkErr) {
        console.warn('Lỗi khi liên kết student doc:', linkErr);
      }
    }

    return { uid: targetUid, email: cleanEmail, isLinkedExisting };
  },

  // Cập nhật thông tin tài khoản người dùng (Sử dụng setDoc merge để tự động tạo document nếu chưa có)
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, 'users', uid);
    const currentUser = auth.currentUser;
    const cleanUpdates: Record<string, any> = {
      uid,
      ...(currentUser?.email ? { email: currentUser.email } : {}),
      status: 'active',
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, cleanUpdates, { merge: true });

    // Đồng bộ Firebase Auth profile nếu là tài khoản đang đăng nhập
    if (currentUser && currentUser.uid === uid) {
      const authUpdates: { displayName?: string; photoURL?: string } = {};
      if (updates.displayName !== undefined) authUpdates.displayName = updates.displayName.trim();
      if (updates.photoURL !== undefined) authUpdates.photoURL = updates.photoURL;
      if (Object.keys(authUpdates).length > 0) {
        try {
          await updateProfile(currentUser, authUpdates);
        } catch (e) {
          console.warn('Could not update Firebase Auth profile:', e);
        }
      }
    }
  },

  // Đổi mật khẩu tài khoản đang đăng nhập
  async changeCurrentUserPassword(newPassword: string): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Chưa đăng nhập.');
    }
    await updatePassword(auth.currentUser, newPassword);
  },

  // Super Admin chỉnh sửa thông tin & phân quyền tài khoản (Tên, vai trò, trạng thái, SĐT)
  async updateUserByAdmin(
    uid: string,
    updates: {
      displayName?: string;
      role?: Role;
      status?: 'active' | 'inactive' | 'locked';
      phone?: string;
    }
  ): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      uid,
      ...updates,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  },

  // Cập nhật vai trò (Role) của người dùng
  async updateUserRole(uid: string, newRole: Role): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      uid,
      role: newRole,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  },

  // Xóa tài khoản khỏi danh sách người dùng Firestore
  async deleteUserProfile(uid: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid));
  },

  // Đăng ký tài khoản trực tiếp cho người dùng mới trên Firebase Authentication
  async registerUser(
    email: string,
    password: string,
    displayName: string,
    role: Role = 'student'
  ): Promise<FirebaseUser> {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = credential.user;

    if (displayName) {
      try {
        await updateProfile(user, { displayName: displayName.trim() });
      } catch (e) {
        console.warn('Could not update displayName:', e);
      }
    }

    const userProfile: UserProfile = {
      uid: user.uid,
      email: email.trim(),
      displayName: displayName.trim(),
      role,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', user.uid), userProfile);

    return user;
  }
};
