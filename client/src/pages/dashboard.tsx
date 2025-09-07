import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";
import { ParentDashboard } from "@/components/dashboard/parent-dashboard";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [currentView, setCurrentView] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
      return;
    }
    
    if (user && !currentView) {
      setCurrentView(user.role);
    }
  }, [user, isLoading, setLocation, currentView]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const renderDashboard = () => {
    switch (currentView) {
      case 'student':
        return <StudentDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'parent':
        return <ParentDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />
      
      <main className={`flex-1 transition-all duration-300 ${isMobile ? 'ml-0' : 'ml-64'}`}>
        <Header onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="p-6">
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
}
