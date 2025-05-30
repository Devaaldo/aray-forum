import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Pages
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import ExplorePage from "./pages/ExplorePage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";

// Layout
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoadingSpinner from "./components/ui/LoadingSpinner";

function App() {
	const { user, loading, checkAuth } = useAuthStore();

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	if (loading) {
		return (
			<div className="min-h-screen bg-red-500 flex items-center justify-center test-class">
				<div className="bg-blue-500 p-8 rounded-lg">
					<LoadingSpinner size="lg" />
					<p className="text-white mt-4">Testing Tailwind CSS...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 test-class">
			<AnimatePresence mode="wait">
				<Routes>
					{/* Public Routes */}
					<Route
						path="/auth"
						element={user ? <Navigate to="/" replace /> : <AuthPage />}
					/>

					{/* Protected Routes */}
					<Route
						path="/"
						element={
							<ProtectedRoute>
								<Layout>
									<HomePage />
								</Layout>
							</ProtectedRoute>
						}
					/>

					<Route
						path="/explore"
						element={
							<ProtectedRoute>
								<Layout>
									<ExplorePage />
								</Layout>
							</ProtectedRoute>
						}
					/>

					<Route
						path="/notifications"
						element={
							<ProtectedRoute>
								<Layout>
									<NotificationsPage />
								</Layout>
							</ProtectedRoute>
						}
					/>

					<Route
						path="/profile/:username?"
						element={
							<ProtectedRoute>
								<Layout>
									<ProfilePage />
								</Layout>
							</ProtectedRoute>
						}
					/>

					<Route
						path="/settings"
						element={
							<ProtectedRoute>
								<Layout>
									<SettingsPage />
								</Layout>
							</ProtectedRoute>
						}
					/>

					{/* Redirect to auth if not authenticated */}
					<Route
						path="*"
						element={
							user ? (
								<Navigate to="/" replace />
							) : (
								<Navigate to="/auth" replace />
							)
						}
					/>
				</Routes>
			</AnimatePresence>
		</div>
	);
}

export default App;
