import { ReactNode } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PhotoInputPage from './pages/PhotoInputPage';
import AnalysisResultsPage from './pages/AnalysisResultsPage';
import MedicationDetailsPage from './pages/MedicationDetailsPage';
import HistoryPage from './pages/HistoryPage';
import AboutPage from './pages/AboutPage';
import ProfilePage from './pages/ProfilePage';
import DermatologistChatPage from './pages/DermatologistChatPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import ChatHistoryPage from './pages/ChatHistoryPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  { name: 'Home', path: '/', element: <HomePage />, public: true },
  { name: 'Login', path: '/login', element: <LoginPage />, public: true },
  { name: 'Register', path: '/register', element: <RegisterPage />, public: true },
  { name: 'Photo Input', path: '/photo-input', element: <PhotoInputPage /> },
  { name: 'Analysis Results', path: '/analysis-results', element: <AnalysisResultsPage /> },
  { name: 'Medication Details', path: '/medication/:medicationIndex', element: <MedicationDetailsPage /> },
  { name: 'History', path: '/history', element: <HistoryPage /> },
  { name: 'Chat History', path: '/chat-history', element: <ChatHistoryPage /> },
  { name: 'Profile', path: '/profile', element: <ProfilePage /> },
  { name: 'About', path: '/about', element: <AboutPage />, public: true },
  { name: 'Dermatologist Chat', path: '/dermatologist-chat', element: <DermatologistChatPage /> },
  { name: 'Book Appointment', path: '/book-appointment', element: <BookAppointmentPage /> },
  { name: 'Payment Success', path: '/payment-success', element: <PaymentSuccessPage />, public: true },
  { name: 'My Appointments', path: '/my-appointments', element: <MyAppointmentsPage /> },
];
