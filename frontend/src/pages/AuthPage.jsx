import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import LoadingSpinner from "../ui/LoadingSpinner";

const ProtectedRoute = ({ children }) => {
	const { isAuthenticated, loading } = useAuthStore();

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/auth" replace />;
	}

	return children;
};

export default ProtectedRoute;
