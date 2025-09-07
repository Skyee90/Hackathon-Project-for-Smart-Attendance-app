import React, { useState, useEffect, ReactNode } from 'react';
import { AuthContext, AuthContextType } from '@/lib/auth';
import { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (token) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const checkAuth = async () => {
    try {
      const response = await apiRequest('GET', '/api/auth/me');
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      const data = await response.json();
      
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      
      toast({
        title: "Welcome back!",
        description: `Logged in successfully as ${data.user.name}`,
      });
      
      setLocation('/dashboard');
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const signup = async (email: string, password: string, name: string, role: string) => {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/auth/signup', { email, password, name, role });
      const data = await response.json();
      
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      
      toast({
        title: "Account created!",
        description: `Welcome to EduGamify, ${data.user.name}${data.user.studentId ? ` (ID: ${data.user.studentId})` : ''}`,
      });
      
      setLocation('/dashboard');
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setLocation('/login');
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
