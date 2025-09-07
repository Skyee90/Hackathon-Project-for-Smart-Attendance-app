import type { Express, Request } from "express";

interface AuthRequest extends Request {
  user?: any;
}
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertAttendanceSchema, insertHomeworkSchema, insertHomeworkSubmissionSchema, insertQRCodeSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

// Middleware to verify JWT token  
const authenticateToken = (req: AuthRequest, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      
      res.json({ user: { ...user, password: undefined }, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.validateUser(email, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      
      res.json({ user: { ...user, password: undefined }, token });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/student", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getStudentDashboardData(req.user.id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/teacher", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Access denied" });
      }
      const data = await storage.getTeacherDashboardData(req.user.id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/parent", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'parent') {
        return res.status(403).json({ message: "Access denied" });
      }
      const data = await storage.getParentDashboardData(req.user.id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Attendance routes
  app.post("/api/attendance/mark", authenticateToken, async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const attendance = await storage.markAttendance(attendanceData);
      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/attendance/qr-checkin", authenticateToken, async (req, res) => {
    try {
      const { code } = req.body;
      const qrCode = await storage.getQRCode(code);
      
      if (!qrCode || !qrCode.isActive || new Date() > qrCode.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired QR code" });
      }

      const attendance = await storage.markAttendance({
        userId: req.user.id,
        date: qrCode.date,
        isPresent: true,
        method: "qr"
      });

      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/attendance/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getAttendanceStats(req.user.id);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // QR Code routes
  app.post("/api/qr/generate", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can generate QR codes" });
      }

      const { date, expirationMinutes = 30 } = req.body;
      const code = `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

      const qrCodeRecord = await storage.createQRCode({
        code,
        expiresAt,
        date,
        createdBy: req.user.id
      });

      const qrCodeDataUrl = await QRCode.toDataURL(code);

      res.json({ ...qrCodeRecord, dataUrl: qrCodeDataUrl });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Gamification routes
  app.get("/api/gamification/leaderboard", authenticateToken, async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard(10);
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/achievements", authenticateToken, async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/achievements/user", authenticateToken, async (req, res) => {
    try {
      const userAchievements = await storage.getUserAchievements(req.user.id);
      res.json(userAchievements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Homework routes
  app.post("/api/homework", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can create homework" });
      }

      const homeworkData = insertHomeworkSchema.parse(req.body);
      const homework = await storage.createHomework({
        ...homeworkData,
        createdBy: req.user.id
      });

      res.json(homework);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/homework", authenticateToken, async (req, res) => {
    try {
      const homework = await storage.getHomework();
      res.json(homework);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/homework/:id/submit", authenticateToken, async (req, res) => {
    try {
      const homeworkId = req.params.id;
      const submission = await storage.submitHomework({
        homeworkId,
        userId: req.user.id
      });

      res.json(submission);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
