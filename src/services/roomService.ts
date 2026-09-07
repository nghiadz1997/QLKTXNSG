import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  runTransaction,
  query,
  where,
  orderBy,
  addDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Building, Room, RoomMember, StudentRoomHistory } from '../types';
import { auditService } from './auditService';

const BUILDINGS_COLLECTION = 'buildings';
const ROOMS_COLLECTION = 'rooms';
const STUDENTS_COLLECTION = 'students';
const ROOM_HISTORY_COLLECTION = 'studentRoomHistory';

export const roomService = {
  // Buildings
  async getBuildings(): Promise<Building[]> {
    try {
      const q = query(collection(db, BUILDINGS_COLLECTION), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Building[];
    } catch (error) {
      console.error('Error fetching buildings:', error);
      return [];
    }
  },

  async createBuilding(
    data: Omit<Building, 'id' | 'createdAt'>,
    adminUid: string,
    adminEmail?: string
  ): Promise<Building> {
    const docRef = doc(db, BUILDINGS_COLLECTION, data.buildingId);
    const buildingData = {
      ...data,
      id: data.buildingId,
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, buildingData);

    await auditService.logAction(
      'Thêm tòa nhà mới',
      adminUid,
      adminEmail,
      'manager',
      BUILDINGS_COLLECTION,
      data.buildingId,
      null,
      buildingData
    );

    return buildingData;
  },

  // Rooms
  async getRooms(buildingId?: string): Promise<Room[]> {
    try {
      let q = query(collection(db, ROOMS_COLLECTION), orderBy('roomId', 'asc'));
      if (buildingId) {
        q = query(collection(db, ROOMS_COLLECTION), where('buildingId', '==', buildingId), orderBy('roomId', 'asc'));
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Room[];
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  },

  async getRoomById(roomId: string): Promise<Room | null> {
    try {
      const docRef = doc(db, ROOMS_COLLECTION, roomId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Room;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching room ${roomId}:`, error);
      return null;
    }
  },

  async createRoom(
    roomData: Omit<Room, 'id' | 'currentOccupants' | 'availableSlots' | 'status' | 'createdAt' | 'updatedAt'>,
    adminUid: string,
    adminEmail?: string
  ): Promise<Room> {
    const docRef = doc(db, ROOMS_COLLECTION, roomData.roomId);
    const nowIso = new Date().toISOString();
    const newRoom: Room = {
      ...roomData,
      id: roomData.roomId,
      currentOccupants: 0,
      availableSlots: roomData.capacity,
      status: 'available',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await setDoc(docRef, newRoom);

    await auditService.logAction(
      'Tạo phòng KTX mới',
      adminUid,
      adminEmail,
      'manager',
      ROOMS_COLLECTION,
      roomData.roomId,
      null,
      newRoom
    );

    return newRoom;
  },

  // Room Members
  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    try {
      const membersRef = collection(db, `${ROOMS_COLLECTION}/${roomId}/members`);
      const snap = await getDocs(membersRef);
      return snap.docs.map(d => ({ studentId: d.id, ...d.data() })) as RoomMember[];
    } catch (error) {
      console.error(`Error fetching room members for ${roomId}:`, error);
      return [];
    }
  },

  // ATOMIC TRANSACTION: Assign student to room
  async assignStudentToRoom(
    studentUid: string,
    roomId: string,
    performedByUid: string,
    performedByEmail?: string,
    role: string = 'manager'
  ): Promise<void> {
    await runTransaction(db, async transaction => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      const studentRef = doc(db, STUDENTS_COLLECTION, studentUid);

      const roomSnap = await transaction.get(roomRef);
      const studentSnap = await transaction.get(studentRef);

      if (!roomSnap.exists()) {
        throw new Error(`Phòng ${roomId} không tồn tại.`);
      }
      if (!studentSnap.exists()) {
        throw new Error(`Sinh viên ${studentUid} không tồn tại.`);
      }

      const roomData = roomSnap.data() as Room;
      const studentData = studentSnap.data();

      // Check room capacity
      if (roomData.currentOccupants >= roomData.capacity) {
        throw new Error(`Phòng ${roomId} đã đầy (${roomData.currentOccupants}/${roomData.capacity}). Không thể xếp thêm sinh viên.`);
      }

      if (roomData.status === 'maintenance' || roomData.status === 'locked') {
        throw new Error(`Phòng ${roomId} đang ở trạng thái ${roomData.status}, không thể nhận sinh viên.`);
      }

      const nowIso = new Date().toISOString();
      const newOccupants = roomData.currentOccupants + 1;
      const newAvailable = roomData.capacity - newOccupants;
      const newRoomStatus = newOccupants >= roomData.capacity ? 'full' : 'available';

      // 1. Update Room
      transaction.update(roomRef, {
        currentOccupants: newOccupants,
        availableSlots: newAvailable,
        status: newRoomStatus,
        updatedAt: nowIso,
      });

      // 2. Update Student
      transaction.update(studentRef, {
        roomId: roomId,
        buildingId: roomData.buildingId,
        dormStatus: 'living',
        checkInDate: nowIso,
        updatedAt: nowIso,
      });

      // 3. Add to Room Members subcollection
      const memberRef = doc(db, `${ROOMS_COLLECTION}/${roomId}/members`, studentUid);
      const memberData: RoomMember = {
        studentId: studentUid,
        hssv: studentData.hssv || '',
        cccd: studentData.cccd || '',
        fullName: studentData.fullName || '',
        className: studentData.className || '',
        major: studentData.major || '',
        phone: studentData.phone || '',
        checkInDate: nowIso,
      };
      transaction.set(memberRef, memberData);

      // 4. Create History
      const historyRef = doc(collection(db, ROOM_HISTORY_COLLECTION));
      const historyData: StudentRoomHistory = {
        studentUid,
        roomId,
        buildingId: roomData.buildingId,
        action: 'checkIn',
        checkInDate: nowIso,
        performedBy: performedByUid,
        createdAt: nowIso,
      };
      transaction.set(historyRef, historyData);
    });

    await auditService.logAction(
      'Phân phòng sinh viên',
      performedByUid,
      performedByEmail,
      role,
      STUDENTS_COLLECTION,
      studentUid,
      null,
      { roomId },
      `Phân sinh viên vào phòng ${roomId}`
    );
  },

  // ATOMIC TRANSACTION: Transfer student from old room to new room
  async transferStudentRoom(
    studentUid: string,
    oldRoomId: string,
    newRoomId: string,
    performedByUid: string,
    performedByEmail?: string,
    role: string = 'manager'
  ): Promise<void> {
    if (oldRoomId === newRoomId) {
      throw new Error('Phòng mới phải khác phòng hiện tại.');
    }

    await runTransaction(db, async transaction => {
      const oldRoomRef = doc(db, ROOMS_COLLECTION, oldRoomId);
      const newRoomRef = doc(db, ROOMS_COLLECTION, newRoomId);
      const studentRef = doc(db, STUDENTS_COLLECTION, studentUid);

      const oldRoomSnap = await transaction.get(oldRoomRef);
      const newRoomSnap = await transaction.get(newRoomRef);
      const studentSnap = await transaction.get(studentRef);

      if (!oldRoomSnap.exists()) throw new Error(`Phòng cũ ${oldRoomId} không tồn tại.`);
      if (!newRoomSnap.exists()) throw new Error(`Phòng mới ${newRoomId} không tồn tại.`);
      if (!studentSnap.exists()) throw new Error(`Sinh viên ${studentUid} không tồn tại.`);

      const oldRoom = oldRoomSnap.data() as Room;
      const newRoom = newRoomSnap.data() as Room;
      const studentData = studentSnap.data();

      // Check new room capacity
      if (newRoom.currentOccupants >= newRoom.capacity) {
        throw new Error(`Phòng mới ${newRoomId} đã đầy (${newRoom.currentOccupants}/${newRoom.capacity}). Không thể chuyển vào.`);
      }

      const nowIso = new Date().toISOString();

      // 1. Decrement old room
      const oldOccupants = Math.max(0, oldRoom.currentOccupants - 1);
      transaction.update(oldRoomRef, {
        currentOccupants: oldOccupants,
        availableSlots: oldRoom.capacity - oldOccupants,
        status: oldOccupants >= oldRoom.capacity ? 'full' : 'available',
        updatedAt: nowIso,
      });

      // 2. Increment new room
      const newOccupants = newRoom.currentOccupants + 1;
      transaction.update(newRoomRef, {
        currentOccupants: newOccupants,
        availableSlots: newRoom.capacity - newOccupants,
        status: newOccupants >= newRoom.capacity ? 'full' : 'available',
        updatedAt: nowIso,
      });

      // 3. Remove from old room members
      const oldMemberRef = doc(db, `${ROOMS_COLLECTION}/${oldRoomId}/members`, studentUid);
      transaction.delete(oldMemberRef);

      // 4. Add to new room members
      const newMemberRef = doc(db, `${ROOMS_COLLECTION}/${newRoomId}/members`, studentUid);
      const memberData: RoomMember = {
        studentId: studentUid,
        hssv: studentData.hssv || '',
        cccd: studentData.cccd || '',
        fullName: studentData.fullName || '',
        className: studentData.className || '',
        major: studentData.major || '',
        phone: studentData.phone || '',
        checkInDate: nowIso,
      };
      transaction.set(newMemberRef, memberData);

      // 5. Update Student profile
      transaction.update(studentRef, {
        roomId: newRoomId,
        buildingId: newRoom.buildingId,
        dormStatus: 'living',
        updatedAt: nowIso,
      });

      // 6. Record Room History
      const historyRef = doc(collection(db, ROOM_HISTORY_COLLECTION));
      transaction.set(historyRef, {
        studentUid,
        roomId: newRoomId,
        buildingId: newRoom.buildingId,
        action: 'transfer',
        checkInDate: nowIso,
        checkOutDate: nowIso,
        performedBy: performedByUid,
        createdAt: nowIso,
      });
    });

    await auditService.logAction(
      'Chuyển phòng sinh viên',
      performedByUid,
      performedByEmail,
      role,
      STUDENTS_COLLECTION,
      studentUid,
      { roomId: oldRoomId },
      { roomId: newRoomId },
      `Chuyển sinh viên từ ${oldRoomId} sang ${newRoomId}`
    );
  },

  // ATOMIC TRANSACTION: Check out student
  async checkOutStudent(
    studentUid: string,
    roomId: string,
    performedByUid: string,
    performedByEmail?: string,
    role: string = 'manager'
  ): Promise<void> {
    await runTransaction(db, async transaction => {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      const studentRef = doc(db, STUDENTS_COLLECTION, studentUid);

      const roomSnap = await transaction.get(roomRef);
      const studentSnap = await transaction.get(studentRef);

      if (!roomSnap.exists()) throw new Error(`Phòng ${roomId} không tồn tại.`);
      if (!studentSnap.exists()) throw new Error(`Sinh viên ${studentUid} không tồn tại.`);

      const room = roomSnap.data() as Room;
      const nowIso = new Date().toISOString();

      // Decrement room
      const newOccupants = Math.max(0, room.currentOccupants - 1);
      transaction.update(roomRef, {
        currentOccupants: newOccupants,
        availableSlots: room.capacity - newOccupants,
        status: newOccupants >= room.capacity ? 'full' : 'available',
        updatedAt: nowIso,
      });

      // Remove from members
      const memberRef = doc(db, `${ROOMS_COLLECTION}/${roomId}/members`, studentUid);
      transaction.delete(memberRef);

      // Update student
      transaction.update(studentRef, {
        roomId: null,
        buildingId: null,
        dormStatus: 'checkedOut',
        checkOutDate: nowIso,
        updatedAt: nowIso,
      });

      // Record History
      const historyRef = doc(collection(db, ROOM_HISTORY_COLLECTION));
      transaction.set(historyRef, {
        studentUid,
        roomId,
        buildingId: room.buildingId,
        action: 'checkOut',
        checkInDate: studentSnap.data().checkInDate || nowIso,
        checkOutDate: nowIso,
        performedBy: performedByUid,
        createdAt: nowIso,
      });
    });

    await auditService.logAction(
      'Check-out sinh viên',
      performedByUid,
      performedByEmail,
      role,
      STUDENTS_COLLECTION,
      studentUid,
      { roomId },
      { dormStatus: 'checkedOut' },
      `Trả phòng ${roomId}`
    );
  },
};
