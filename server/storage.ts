import { type User, type InsertUser, type Attendance, type InsertAttendance, type Gamification, type Achievement, type UserAchievement, type Homework, type InsertHomework, type HomeworkSubmission, type InsertHomeworkSubmission, type QRCode, type InsertQRCode } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStudentId(studentId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUser(email: string, password: string): Promise<User | null>;
  
  // Attendance methods
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceByUserId(userId: string, limit?: number): Promise<Attendance[]>;
  getAttendanceByDate(date: string): Promise<Attendance[]>;
  getAttendanceStats(userId: string): Promise<{ rate: number; streak: number; totalDays: number }>;
  
  // Gamification methods
  getGamification(userId: string): Promise<Gamification | undefined>;
  updateGamification(userId: string, data: Partial<Gamification>): Promise<Gamification>;
  getLeaderboard(limit?: number): Promise<(Gamification & { user: User })[]>;
  
  // Achievement methods
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement>;
  
  // Homework methods
  createHomework(homework: InsertHomework & { createdBy: string }): Promise<Homework>;
  getHomework(): Promise<Homework[]>;
  getHomeworkByTeacher(teacherId: string): Promise<Homework[]>;
  submitHomework(submission: InsertHomeworkSubmission): Promise<HomeworkSubmission>;
  getHomeworkSubmissions(homeworkId: string): Promise<(HomeworkSubmission & { user: User })[]>;
  
  // QR Code methods
  createQRCode(qrCode: InsertQRCode & { createdBy: string }): Promise<QRCode>;
  getQRCode(code: string): Promise<QRCode | undefined>;
  
  // Dashboard data
  getStudentDashboardData(userId: string): Promise<any>;
  getTeacherDashboardData(userId: string): Promise<any>;
  getParentDashboardData(parentId: string): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private attendance: Map<string, Attendance> = new Map();
  private gamification: Map<string, Gamification> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private userAchievements: Map<string, UserAchievement> = new Map();
  private homework: Map<string, Homework> = new Map();
  private homeworkSubmissions: Map<string, HomeworkSubmission> = new Map();
  private qrCodes: Map<string, QRCode> = new Map();

  constructor() {
    this.initializeDefaultData();
    this.createDemoUsers();
  }

  private async createDemoUsers() {
    // Create demo student
    try {
      const demoStudent = await this.createUser({
        email: "student@demo.com",
        password: "password",
        name: "Alex Johnson", 
        role: "student"
      });

      // Create demo teacher
      await this.createUser({
        email: "teacher@demo.com",
        password: "password",
        name: "Ms. Sarah Wilson",
        role: "teacher"
      });

      // Create demo parent
      await this.createUser({
        email: "parent@demo.com", 
        password: "password",
        name: "Jennifer Johnson",
        role: "parent"
      });

      // Add some sample attendance data for the student
      const today = new Date().toISOString().split('T')[0];
      await this.markAttendance({
        userId: demoStudent.id,
        date: today,
        isPresent: true,
        method: "manual"
      });

      // Add attendance for past 5 days
      for (let i = 1; i <= 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        await this.markAttendance({
          userId: demoStudent.id,
          date: date.toISOString().split('T')[0],
          isPresent: Math.random() > 0.2, // 80% attendance
          method: "manual"
        });
      }
    } catch (error) {
      // Demo users may already exist, ignore errors
    }
  }

  private initializeDefaultData() {
    // Initialize default achievements
    const defaultAchievements: Achievement[] = [
      {
        id: "1",
        name: "Perfect Week",
        description: "Attend all days in a week",
        icon: "trophy",
        xpReward: 500,
        type: "attendance",
        condition: JSON.stringify({ weeklyAttendance: 7 })
      },
      {
        id: "2",
        name: "Streak Master",
        description: "10+ day attendance streak",
        icon: "fire",
        xpReward: 1000,
        type: "attendance",
        condition: JSON.stringify({ streak: 10 })
      },
      {
        id: "3",
        name: "Study Champion",
        description: "Complete 10 homework assignments on time",
        icon: "book",
        xpReward: 750,
        type: "homework",
        condition: JSON.stringify({ onTimeHomework: 10 })
      }
    ];

    defaultAchievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.studentId === studentId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    // Generate student ID
    const studentId = insertUser.role === 'student' ? 
      `STU${new Date().getFullYear()}${String(this.users.size + 1).padStart(3, '0')}` : 
      undefined;

    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      studentId: studentId || null,
      parentId: null,
      createdAt: new Date()
    };

    this.users.set(id, user);

    // Initialize gamification for students
    if (user.role === 'student') {
      const gamificationData: Gamification = {
        id: randomUUID(),
        userId: id,
        xp: 0,
        level: 1,
        streak: 0,
        longestStreak: 0,
        totalDaysAttended: 0,
        updatedAt: new Date()
      };
      this.gamification.set(id, gamificationData);
    }

    return user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async markAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = randomUUID();
    const attendanceRecord: Attendance = {
      ...insertAttendance,
      id,
      method: insertAttendance.method || "manual",
      checkedInAt: insertAttendance.isPresent ? new Date() : null,
      createdAt: new Date()
    };

    this.attendance.set(id, attendanceRecord);

    // Update gamification data if present
    if (insertAttendance.isPresent) {
      await this.updateAttendanceStreak(insertAttendance.userId);
      await this.awardXP(insertAttendance.userId, 25); // 25 XP for attendance
    }

    return attendanceRecord;
  }

  private async updateAttendanceStreak(userId: string): Promise<void> {
    const userAttendance = Array.from(this.attendance.values())
      .filter(a => a.userId === userId && a.isPresent)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let currentStreak = 0;
    const today = new Date();
    
    for (const record of userAttendance) {
      const recordDate = new Date(record.date);
      const daysDiff = Math.floor((today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === currentStreak) {
        currentStreak++;
      } else {
        break;
      }
    }

    const gamificationData = this.gamification.get(userId);
    if (gamificationData) {
      const updatedData = {
        ...gamificationData,
        streak: currentStreak,
        longestStreak: Math.max(currentStreak, gamificationData.longestStreak),
        totalDaysAttended: userAttendance.length,
        updatedAt: new Date()
      };
      this.gamification.set(userId, updatedData);

      // Check for streak achievements
      if (currentStreak >= 10 && currentStreak % 10 === 0) {
        await this.checkAndUnlockAchievements(userId);
      }
    }
  }

  private async awardXP(userId: string, xpAmount: number): Promise<void> {
    const gamificationData = this.gamification.get(userId);
    if (gamificationData) {
      const newXP = gamificationData.xp + xpAmount;
      const newLevel = Math.floor(newXP / 1000) + 1; // Level up every 1000 XP

      const updatedData = {
        ...gamificationData,
        xp: newXP,
        level: newLevel,
        updatedAt: new Date()
      };
      this.gamification.set(userId, updatedData);
    }
  }

  private async checkAndUnlockAchievements(userId: string): Promise<void> {
    const userGamification = this.gamification.get(userId);
    if (!userGamification) return;

    const userAchievementIds = Array.from(this.userAchievements.values())
      .filter(ua => ua.userId === userId)
      .map(ua => ua.achievementId);

    for (const achievement of this.achievements.values()) {
      if (userAchievementIds.includes(achievement.id)) continue;

      const condition = JSON.parse(achievement.condition);
      let shouldUnlock = false;

      if (achievement.type === 'attendance') {
        if (condition.streak && userGamification.streak >= condition.streak) {
          shouldUnlock = true;
        }
      }

      if (shouldUnlock) {
        await this.unlockAchievement(userId, achievement.id);
        await this.awardXP(userId, achievement.xpReward);
      }
    }
  }

  async getAttendanceByUserId(userId: string, limit?: number): Promise<Attendance[]> {
    const userAttendance = Array.from(this.attendance.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return limit ? userAttendance.slice(0, limit) : userAttendance;
  }

  async getAttendanceByDate(date: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(a => a.date === date);
  }

  async getAttendanceStats(userId: string): Promise<{ rate: number; streak: number; totalDays: number }> {
    const gamificationData = this.gamification.get(userId);
    const userAttendance = await this.getAttendanceByUserId(userId);
    
    const totalDays = userAttendance.length;
    const presentDays = userAttendance.filter(a => a.isPresent).length;
    const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return {
      rate,
      streak: gamificationData?.streak || 0,
      totalDays: presentDays
    };
  }

  async getGamification(userId: string): Promise<Gamification | undefined> {
    return this.gamification.get(userId);
  }

  async updateGamification(userId: string, data: Partial<Gamification>): Promise<Gamification> {
    const existing = this.gamification.get(userId);
    if (!existing) {
      throw new Error('Gamification data not found');
    }

    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.gamification.set(userId, updated);
    return updated;
  }

  async getLeaderboard(limit = 10): Promise<(Gamification & { user: User })[]> {
    const leaderboard = Array.from(this.gamification.values())
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit)
      .map(gamification => {
        const user = this.users.get(gamification.userId);
        return { ...gamification, user: user! };
      });

    return leaderboard;
  }

  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]> {
    return Array.from(this.userAchievements.values())
      .filter(ua => ua.userId === userId)
      .map(ua => {
        const achievement = this.achievements.get(ua.achievementId);
        return { ...ua, achievement: achievement! };
      });
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    const id = randomUUID();
    const userAchievement: UserAchievement = {
      id,
      userId,
      achievementId,
      unlockedAt: new Date()
    };

    this.userAchievements.set(id, userAchievement);
    return userAchievement;
  }

  async createHomework(homework: InsertHomework & { createdBy: string }): Promise<Homework> {
    const id = randomUUID();
    const homeworkRecord: Homework = {
      ...homework,
      id,
      createdAt: new Date()
    };

    this.homework.set(id, homeworkRecord);
    return homeworkRecord;
  }

  async getHomework(): Promise<Homework[]> {
    return Array.from(this.homework.values());
  }

  async getHomeworkByTeacher(teacherId: string): Promise<Homework[]> {
    return Array.from(this.homework.values()).filter(h => h.createdBy === teacherId);
  }

  async submitHomework(insertSubmission: InsertHomeworkSubmission): Promise<HomeworkSubmission> {
    const id = randomUUID();
    const homework = this.homework.get(insertSubmission.homeworkId);
    const isOnTime = homework ? new Date() <= homework.dueDate : false;

    const submission: HomeworkSubmission = {
      ...insertSubmission,
      id,
      submittedAt: new Date(),
      isOnTime,
      grade: null
    };

    this.homeworkSubmissions.set(id, submission);

    // Award XP for homework submission
    if (isOnTime) {
      await this.awardXP(insertSubmission.userId, 100);
    } else {
      await this.awardXP(insertSubmission.userId, 50);
    }

    return submission;
  }

  async getHomeworkSubmissions(homeworkId: string): Promise<(HomeworkSubmission & { user: User })[]> {
    return Array.from(this.homeworkSubmissions.values())
      .filter(hs => hs.homeworkId === homeworkId)
      .map(hs => {
        const user = this.users.get(hs.userId);
        return { ...hs, user: user! };
      });
  }

  async createQRCode(insertQRCode: InsertQRCode & { createdBy: string }): Promise<QRCode> {
    const id = randomUUID();
    const qrCode: QRCode = {
      ...insertQRCode,
      id,
      isActive: true,
      createdAt: new Date()
    };

    this.qrCodes.set(id, qrCode);
    return qrCode;
  }

  async getQRCode(code: string): Promise<QRCode | undefined> {
    return Array.from(this.qrCodes.values()).find(qr => qr.code === code && qr.isActive);
  }

  async getStudentDashboardData(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    const gamificationData = await this.getGamification(userId);
    const attendanceStats = await this.getAttendanceStats(userId);
    const recentAttendance = await this.getAttendanceByUserId(userId, 30);
    const achievements = await this.getUserAchievements(userId);

    return {
      user,
      gamification: gamificationData,
      attendance: {
        ...attendanceStats,
        recent: recentAttendance
      },
      achievements
    };
  }

  async getTeacherDashboardData(userId: string): Promise<any> {
    const allStudents = Array.from(this.users.values()).filter(u => u.role === 'student');
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await this.getAttendanceByDate(today);
    
    const presentToday = todayAttendance.filter(a => a.isPresent).length;
    const lowAttendanceStudents = [];

    for (const student of allStudents) {
      const stats = await this.getAttendanceStats(student.id);
      if (stats.rate < 70) {
        lowAttendanceStudents.push({ ...student, attendanceRate: stats.rate });
      }
    }

    const homework = await this.getHomeworkByTeacher(userId);

    return {
      totalStudents: allStudents.length,
      presentToday,
      lowAttendanceStudents,
      avgAttendance: 87, // Calculate average
      homework
    };
  }

  async getParentDashboardData(parentId: string): Promise<any> {
    const children = Array.from(this.users.values()).filter(u => u.parentId === parentId);
    const childrenData = [];

    for (const child of children) {
      const gamificationData = await this.getGamification(child.id);
      const attendanceStats = await this.getAttendanceStats(child.id);
      const achievements = await this.getUserAchievements(child.id);

      childrenData.push({
        child,
        gamification: gamificationData,
        attendance: attendanceStats,
        achievements
      });
    }

    return { children: childrenData };
  }
}

export const storage = new MemStorage();
