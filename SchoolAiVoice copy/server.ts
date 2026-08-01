import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { djangoDb } from './server/djangoStore.js';
import { processVoiceAssistantSession } from './server/aiService.js';
import { handleTelephonyCall } from './server/telephonyAdapter.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[Django REST API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Healthcheck endpoint
  app.get('/api/v1/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Django School Management REST Service & AI Gateway',
      version: '1.0.0',
      djangoBaseUrl: process.env.DJANGO_API_BASE_URL || 'http://localhost:3000/api/v1',
      geminiConfigured: !!process.env.GEMINI_API_KEY,
    });
  });

  // --- DJANGO REST API ENDPOINTS ---

  // Parent Identity Verification API
  app.post('/api/v1/parent/verify', (req, res) => {
    const { parent_phone, student_name, student_class } = req.body;
    const result = djangoDb.verifyParent(parent_phone || '', student_name || '', student_class);
    if (!result.success) {
      return res.status(401).json(result);
    }
    res.json(result);
  });

  // Teacher Authentication API
  app.post('/api/v1/auth/teacher/login', (req, res) => {
    const { username, password } = req.body;
    const result = djangoDb.authenticateTeacher(username || '', password || '');
    if (!result.success) {
      return res.status(401).json(result);
    }
    res.json(result);
  });

  // Student Directory API
  app.get('/api/v1/students', (req, res) => {
    const role = (req.query.role as any) || 'admin';
    const teacherId = req.query.teacher_id as string;
    const students = djangoDb.getAllStudents(role, teacherId);
    res.json({ count: students.length, results: students });
  });

  app.get('/api/v1/students/:id', (req, res) => {
    const role = (req.query.role as any) || 'admin';
    const teacherId = req.query.teacher_id as string;
    const student = djangoDb.getStudentDetails(req.params.id, role, teacherId);
    if (!student) {
      return res.status(404).json({ detail: 'Student not found.' });
    }
    res.json(student);
  });

  app.get('/api/v1/students/:id/academic-summary', (req, res) => {
    const summary = djangoDb.getStudentAcademicSummary(req.params.id);
    res.json({ student_id: req.params.id, summary });
  });

  // Attendance Management APIs
  app.get('/api/v1/attendance', (req, res) => {
    const studentId = req.query.student_id as string;
    if (studentId) {
      return res.json(djangoDb.getStudentAttendance(studentId));
    }
    res.json({ message: 'Provide student_id to view attendance logs.' });
  });

  app.post('/api/v1/attendance/mark', (req, res) => {
    const { student_id, subject, status, teacher_id, period } = req.body;
    const result = djangoDb.markAttendance(
      student_id,
      subject,
      status || 'Present',
      teacher_id || 'TCH-201',
      period
    );
    if (!result.success) {
      return res.status(403).json(result); // Enforce permissions!
    }
    res.json(result);
  });

  // Notebook Verification APIs
  app.get('/api/v1/notebooks', (req, res) => {
    const studentId = req.query.student_id as string;
    res.json(djangoDb.getNotebookStatus(studentId || 'STU-1001'));
  });

  app.post('/api/v1/notebooks/verify', (req, res) => {
    const { qr_code, subject, teacher_id } = req.body;
    const result = djangoDb.verifyNotebookByQR(qr_code, subject || 'General', teacher_id || 'TCH-201');
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // Temporary Exit Tracking APIs
  app.get('/api/v1/exits', (req, res) => {
    const studentId = req.query.student_id as string;
    res.json({ results: djangoDb.getExitRecords(studentId) });
  });

  app.post('/api/v1/exits/scan', (req, res) => {
    const { qr_code_or_id, reason } = req.body;
    const result = djangoDb.scanExitQR(qr_code_or_id, reason);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // Fee Management APIs
  app.get('/api/v1/fees', (req, res) => {
    const studentId = req.query.student_id as string;
    const role = (req.query.role as any) || 'admin';

    if (role === 'teacher') {
      // Teachers cannot view numbers!
      return res.status(403).json({
        detail: 'Permission Denied: Teachers are restricted from viewing monetary fee breakdowns. Only Cleared/Pending status is visible.',
      });
    }

    res.json({ results: djangoDb.getFeeTransactions(studentId) });
  });

  app.post('/api/v1/fees/pay', (req, res) => {
    const { student_id, amount, payment_method } = req.body;
    const result = djangoDb.payFeeInstallment(student_id, Number(amount), payment_method);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // Marks APIs
  app.get('/api/v1/marks', (req, res) => {
    const studentId = req.query.student_id as string;
    res.json({ results: djangoDb.getMarks(studentId || 'STU-1001') });
  });

  app.post('/api/v1/marks/update', (req, res) => {
    const { student_id, subject, exam_type, marks_obtained, max_marks, teacher_id } = req.body;
    const result = djangoDb.updateMarks(
      student_id,
      subject,
      exam_type || 'Midterm',
      Number(marks_obtained),
      Number(max_marks || 100),
      teacher_id
    );
    if (!result.success) {
      return res.status(403).json(result);
    }
    res.json(result);
  });

  // --- AI VOICE ASSISTANT GATEWAY ---
  app.post('/api/ai/voice-assistant', async (req, res) => {
    try {
      const { userMessage, parentState, teacherState, preferredLanguage } = req.body;
      const result = await processVoiceAssistantSession({
        userMessage: userMessage || 'Hello',
        parentState,
        teacherState,
        preferredLanguage,
      });
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/ai/voice-assistant:', error);
      res.status(500).json({ error: error.message || 'AI Voice Session failed.' });
    }
  });

  // --- TELEPHONY ADAPTER HOOK ---
  app.post('/api/telephony/webhook', async (req, res) => {
    try {
      const result = await handleTelephonyCall(req.body);
      if (req.headers['accept']?.includes('application/json')) {
        return res.json(result);
      }
      res.setHeader('Content-Type', 'text/xml');
      res.send(result.twimlXml);
    } catch (error: any) {
      res.status(500).send('<Response><Say>Telephony AI error occurred.</Say></Response>');
    }
  });

  // Vite Dev Server or Static Production Fallback
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(`Apex Academy Django SMS & AI Server running on port ${PORT}`);
    console.log(`Django REST APIs listening on /api/v1/*`);
    console.log(`AI Voice Gateway listening on /api/ai/voice-assistant`);
    console.log(`=================================================`);
  });
}

startServer();
