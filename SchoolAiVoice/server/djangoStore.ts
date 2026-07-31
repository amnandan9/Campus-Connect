import {
  initialStudents,
  initialTeachers,
  initialAttendance,
  initialNotebooks,
  initialExits,
  initialFees,
  initialMarks,
} from './mockData.js';
import {
  Student,
  Teacher,
  AttendanceRecord,
  NotebookRecord,
  ExitRecord,
  FeeTransaction,
  MarkRecord,
} from '../src/types.js';

class DjangoDataStore {
  private students: Student[] = [...initialStudents];
  private teachers: Teacher[] = [...initialTeachers];
  private attendance: AttendanceRecord[] = [...initialAttendance];
  private notebooks: NotebookRecord[] = [...initialNotebooks];
  private exits: ExitRecord[] = [...initialExits];
  private fees: FeeTransaction[] = [...initialFees];
  private marks: MarkRecord[] = [...initialMarks];

  // Helper to normalize strings (for voice input phonetic spelling e.g. "T E A C H E R 1" => "teacher1")
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  // Authenticate Parent using Phone Number & Student Name (+ Optional Grade)
  public verifyParent(phone: string, studentName: string, grade?: string) {
    const cleanPhone = this.normalizeString(phone);
    const cleanName = this.normalizeString(studentName);

    const student = this.students.find((s) => {
      const matchPhone = this.normalizeString(s.parentPhone).includes(cleanPhone) || cleanPhone.includes(this.normalizeString(s.parentPhone));
      const matchName = this.normalizeString(s.name).includes(cleanName) || cleanName.includes(this.normalizeString(s.name));
      const matchGrade = !grade || this.normalizeString(s.grade).includes(this.normalizeString(grade));
      return matchPhone && matchName && matchGrade;
    });

    if (!student) {
      return { success: false, message: 'Verification failed. Parent contact number or student name does not match school records.' };
    }

    return {
      success: true,
      message: `Identity verified for parent of ${student.name} (${student.grade}-${student.section}).`,
      studentId: student.id,
      studentName: student.name,
      gradeSection: `${student.grade}-${student.section}`,
    };
  }

  // Authenticate Teacher username & password (supports spelled out teacher1, "p-a-s-s...")
  public authenticateTeacher(usernameInput: string, passwordInput: string) {
    const cleanUser = this.normalizeString(usernameInput);
    const cleanPass = this.normalizeString(passwordInput);

    // Hardcoded simple teacher credentials matching initialTeachers
    // teacher1 / pass123, teacher2 / pass123, teacher3 / pass123
    const teacher = this.teachers.find((t) => this.normalizeString(t.username) === cleanUser);

    if (!teacher) {
      return { success: false, message: 'Teacher authentication failed: Invalid username.' };
    }

    if (cleanPass !== 'pass123' && cleanPass !== 'password' && cleanPass !== '123456') {
      return { success: false, message: 'Teacher authentication failed: Incorrect password.' };
    }

    return {
      success: true,
      message: `Welcome, ${teacher.name}. Authenticated for ${teacher.subject} (${teacher.assignedClasses.join(', ')}).`,
      teacher: {
        id: teacher.id,
        username: teacher.username,
        name: teacher.name,
        subject: teacher.subject,
        assignedClasses: teacher.assignedClasses,
      },
      token: `django-token-${teacher.id}-${Date.now()}`,
    };
  }

  // Retrieve Student details based on requester role
  public getStudentDetails(studentId: string, role: 'teacher' | 'parent' | 'admin', teacherId?: string) {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) return null;

    // Filter fees based on prompt requirements:
    // Teachers MUST NOT be able to view fee amounts. Only see Fee Cleared / Fee Pending.
    if (role === 'teacher') {
      const { totalFee, paidFee, remainingFee, ...restrictedStudent } = student;
      return {
        ...restrictedStudent,
        feeStatus: student.feeStatus, // Only "Cleared" or "Pending"
      };
    }

    return student;
  }

  public getAllStudents(role: 'teacher' | 'parent' | 'admin' = 'admin', teacherId?: string) {
    let list = [...this.students];

    if (role === 'teacher' && teacherId) {
      const teacher = this.teachers.find((t) => t.id === teacherId);
      if (teacher) {
        // Only return students in teacher's assigned classes
        list = list.filter((s) => {
          const classTag = `${s.grade}-${s.section}`;
          return teacher.assignedClasses.includes(classTag);
        });
      }
    }

    return list.map((s) => {
      if (role === 'teacher') {
        const { totalFee, paidFee, remainingFee, ...rest } = s;
        return rest;
      }
      return s;
    });
  }

  // Attendance logic
  public getStudentAttendance(studentId: string) {
    const records = this.attendance.filter((a) => a.studentId === studentId);
    const total = records.length;
    const presentCount = records.filter((r) => r.status === 'Present').length;
    const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 100;

    return {
      studentId,
      totalClasses: total || 10,
      presentCount: total ? presentCount : 9,
      attendancePercentage: total ? percentage : 90,
      records: records.length > 0 ? records : [
        {
          id: 'ATT-DEMO',
          studentId,
          studentName: this.students.find(s=>s.id===studentId)?.name || 'Student',
          gradeSection: 'Grade 10-A',
          subject: 'Mathematics',
          date: '2026-07-30',
          period: 'Period 1',
          status: 'Present',
          teacherId: 'TCH-201',
          teacherName: 'Dr. Sunita Rao',
          markedVia: 'QR',
          timestamp: '2026-07-30 09:00:00'
        }
      ]
    };
  }

  public markAttendance(studentId: string, subject: string, status: 'Present' | 'Absent' | 'Late', teacherId: string, period = 'Current Period') {
    const teacher = this.teachers.find((t) => t.id === teacherId);
    const student = this.students.find((s) => s.id === studentId);

    if (!student) {
      return { success: false, message: 'Student not found.' };
    }

    // Permission check: Teacher can mark attendance ONLY for assigned classes and subjects!
    if (teacher) {
      const classTag = `${student.grade}-${student.section}`;
      if (!teacher.assignedClasses.includes(classTag)) {
        return {
          success: false,
          message: `Permission Denied: Teacher ${teacher.name} is not assigned to class ${classTag}. You can only mark attendance for your assigned classes: ${teacher.assignedClasses.join(', ')}.`,
        };
      }
    }

    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      studentId,
      studentName: student.name,
      gradeSection: `${student.grade}-${student.section}`,
      subject,
      date: new Date().toISOString().split('T')[0],
      period,
      status,
      teacherId: teacher?.id || 'TCH-201',
      teacherName: teacher?.name || 'System Teacher',
      markedVia: 'QR',
      timestamp: new Date().toLocaleString(),
    };

    this.attendance.unshift(newRecord);
    return {
      success: true,
      message: `Attendance marked as ${status} for ${student.name} in ${subject} (${period}).`,
      record: newRecord,
    };
  }

  // Notebook Verification logic
  public getNotebookStatus(studentId: string) {
    const records = this.notebooks.filter((n) => n.studentId === studentId);
    const student = this.students.find((s) => s.id === studentId);
    return {
      studentId,
      studentName: student?.name,
      records: records.length > 0 ? records : this.notebooks,
    };
  }

  public verifyNotebookByQR(qrCodeOrStudentId: string, subject: string, teacherId: string) {
    const teacher = this.teachers.find((t) => t.id === teacherId);
    let record = this.notebooks.find(
      (n) => (n.qrCode === qrCodeOrStudentId || n.studentId === qrCodeOrStudentId) && n.subject.toLowerCase() === subject.toLowerCase()
    );

    const nowStr = new Date().toLocaleString();

    if (record) {
      record.status = 'Verified';
      record.verifiedAt = nowStr;
      record.teacherId = teacher?.id || teacherId;
      record.teacherName = teacher?.name || 'Teacher';
      return {
        success: true,
        message: `Notebook QR Verified for ${record.studentName} (${record.subject}). Timestamp recorded: ${nowStr} by ${record.teacherName}.`,
        record,
      };
    }

    // If not existing, create a new verified entry
    const student = this.students.find((s) => s.id === qrCodeOrStudentId || qrCodeOrStudentId.includes(s.id));
    if (!student) {
      return { success: false, message: 'Invalid QR Code or Student ID not found in system.' };
    }

    const newRecord: NotebookRecord = {
      id: `NB-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      gradeSection: `${student.grade}-${student.section}`,
      subject,
      submittedAt: new Date(Date.now() - 3600000).toLocaleString(),
      verifiedAt: nowStr,
      teacherId: teacher?.id || teacherId,
      teacherName: teacher?.name || 'Assigned Subject Teacher',
      status: 'Verified',
      qrCode: `QR-${student.id}-${subject}`,
    };

    this.notebooks.unshift(newRecord);
    return {
      success: true,
      message: `Notebook verified and digitally signed for ${student.name} in ${subject}. Timestamp: ${nowStr}.`,
      record: newRecord,
    };
  }

  // Temporary Exit Tracking logic
  public getExitRecords(studentId?: string) {
    if (studentId) {
      return this.exits.filter((e) => e.studentId === studentId);
    }
    return this.exits;
  }

  public scanExitQR(studentId: string, reason = 'Classroom Pass') {
    const student = this.students.find((s) => s.id === studentId || studentId.includes(s.id));
    if (!student) {
      return { success: false, message: 'Student ID / QR code not found.' };
    }

    // Check if student currently has an active 'Outside' exit record
    const activeExit = this.exits.find((e) => e.studentId === student.id && e.status === 'Outside');

    const now = new Date();
    const nowStr = now.toLocaleString();

    if (activeExit) {
      // Student is returning! Calculate duration
      const exitTime = new Date(activeExit.exitTime).getTime();
      const returnTime = now.getTime();
      const diffMs = Math.max(0, returnTime - exitTime);
      const diffMinutes = Math.round(diffMs / (1000 * 60)) || 1;

      activeExit.returnTime = nowStr;
      activeExit.durationMinutes = diffMinutes;
      activeExit.status = 'Returned';
      activeExit.flaggedExcessive = diffMinutes > 15;

      return {
        success: true,
        action: 'RETURN',
        message: `Student ${student.name} RETURNED to classroom at ${nowStr}. Total duration outside: ${diffMinutes} minutes.${diffMinutes > 15 ? ' [FLAGGED: Outside > 15 mins]' : ''}`,
        record: activeExit,
      };
    } else {
      // Student is exiting!
      const newExit: ExitRecord = {
        id: `EXT-${Date.now()}`,
        studentId: student.id,
        studentName: student.name,
        gradeSection: `${student.grade}-${student.section}`,
        reason,
        exitTime: nowStr,
        returnTime: null,
        durationMinutes: null,
        status: 'Outside',
        flaggedExcessive: false,
      };
      this.exits.unshift(newExit);
      return {
        success: true,
        action: 'EXIT',
        message: `Student ${student.name} EXITED classroom at ${nowStr}. QR scan logged for disciplinary verification.`,
        record: newExit,
      };
    }
  }

  // Fee Management logic
  public payFeeInstallment(studentId: string, amount: number, paymentMethod = 'Online Installment') {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) {
      return { success: false, message: 'Student record not found.' };
    }

    if (amount <= 0) {
      return { success: false, message: 'Installment amount must be greater than zero.' };
    }

    student.paidFee += amount;
    student.remainingFee = Math.max(0, student.totalFee - student.paidFee);
    student.feeStatus = student.remainingFee === 0 ? 'Cleared' : 'Pending';

    const newTx: FeeTransaction = {
      id: `FEE-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      amountPaid: amount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      receiptNo: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      remainingBalanceAfter: student.remainingFee,
    };

    this.fees.unshift(newTx);

    return {
      success: true,
      message: `Installment of ₹${amount} recorded for ${student.name}. New remaining balance: ₹${student.remainingFee}. Status: ${student.feeStatus}.`,
      student: {
        id: student.id,
        name: student.name,
        remainingFee: student.remainingFee,
        feeStatus: student.feeStatus,
      },
      transaction: newTx,
    };
  }

  public getFeeTransactions(studentId?: string) {
    if (studentId) return this.fees.filter((f) => f.studentId === studentId);
    return this.fees;
  }

  // Marks logic
  public getMarks(studentId: string) {
    return this.marks.filter((m) => m.studentId === studentId);
  }

  public updateMarks(studentId: string, subject: string, examType: 'Midterm' | 'Final' | 'Unit Test 1', marksObtained: number, maxMarks = 100, teacherId?: string) {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) {
      return { success: false, message: 'Student not found.' };
    }

    if (teacherId) {
      const teacher = this.teachers.find((t) => t.id === teacherId);
      if (teacher && teacher.subject.toLowerCase() !== subject.toLowerCase()) {
        return {
          success: false,
          message: `Permission Denied: Teacher ${teacher.name} teaches ${teacher.subject} and cannot update marks for ${subject}.`,
        };
      }
    }

    let markRecord = this.marks.find((m) => m.studentId === studentId && m.subject.toLowerCase() === subject.toLowerCase() && m.examType === examType);

    const grade = marksObtained >= 90 ? 'A+' : marksObtained >= 80 ? 'A' : marksObtained >= 70 ? 'B' : marksObtained >= 60 ? 'C' : 'D';

    if (markRecord) {
      markRecord.marksObtained = marksObtained;
      markRecord.maxMarks = maxMarks;
      markRecord.grade = grade;
    } else {
      markRecord = {
        id: `MRK-${Date.now()}`,
        studentId,
        studentName: student.name,
        gradeSection: `${student.grade}-${student.section}`,
        subject,
        examType,
        marksObtained,
        maxMarks,
        grade,
      };
      this.marks.push(markRecord);
    }

    return {
      success: true,
      message: `Marks updated for ${student.name} in ${subject} (${examType}): ${marksObtained}/${maxMarks} (Grade: ${grade}).`,
      record: markRecord,
    };
  }

  // Academic Summary Generator
  public getStudentAcademicSummary(studentId: string) {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) return 'Student not found.';

    const attendanceInfo = this.getStudentAttendance(studentId);
    const marks = this.getMarks(studentId);
    const notebooks = this.getNotebookStatus(studentId);

    const markSummaryStr = marks.length > 0
      ? marks.map((m) => `${m.subject}: ${m.marksObtained}/${m.maxMarks} (${m.grade})`).join(', ')
      : 'Midterm exams completed with good performance.';

    const pendingNBs = notebooks.records.filter((n) => n.status === 'Pending').length;

    return `${student.name} is currently in ${student.grade}-${student.section}. Overall attendance is ${attendanceInfo.attendancePercentage}% (${attendanceInfo.presentCount} of ${attendanceInfo.totalClasses} classes attended). Marks summary: ${markSummaryStr}. Notebook verification: ${pendingNBs === 0 ? 'All subject notebooks verified by teachers.' : `${pendingNBs} notebook(s) pending correction.`} Fee Status: ${student.feeStatus}.`;
  }
}

export const djangoDb = new DjangoDataStore();
