import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "../services/api";
import toast from "react-hot-toast";

const useAuthStore = create(
	persist(
		(set, get) => ({
			user: null,
			token: null,
			refreshToken: null,
			loading: false,
			isAuthenticated: false,

			// Actions
			login: async (credentials) => {
				set({ loading: true });
				try {
					const response = await authApi.login(credentials);
					const { user, access_token, refresh_token } = response.data;

					set({
						user,
						token: access_token,
						refreshToken: refresh_token,
						isAuthenticated: true,
						loading: false,
					});

					// Set token in axios defaults
					authApi.setAuthToken(access_token);

					toast.success(`Selamat datang, ${user.name}!`);
					return { success: true };
				} catch (error) {
					set({ loading: false });
					const message = error.response?.data?.error || "Login gagal";
					toast.error(message);
					return { success: false, error: message };
				}
			},

			register: async (userData) => {
				set({ loading: true });
				try {
					const response = await authApi.register(userData);
					const { user, access_token, refresh_token } = response.data;

					set({
						user,
						token: access_token,
						refreshToken: refresh_token,
						isAuthenticated: true,
						loading: false,
					});

					// Set token in axios defaults
					authApi.setAuthToken(access_token);

					toast.success(`Selamat datang, ${user.name}!`);
					return { success: true };
				} catch (error) {
					set({ loading: false });
					const message = error.response?.data?.error || "Registrasi gagal";
					toast.error(message);
					return { success: false, error: message };
				}
			},

			logout: async () => {
				try {
					await authApi.logout();
				} catch (error) {
					console.error("Logout error:", error);
				}

				set({
					user: null,
					token: null,
					refreshToken: null,
					isAuthenticated: false,
				});

				// Remove token from axios defaults
				authApi.setAuthToken(null);

				toast.success("Berhasil logout");
			},

			refreshAuth: async () => {
				const { refreshToken } = get();
				if (!refreshToken) return false;

				try {
					const response = await authApi.refresh(refreshToken);
					const { user, access_token } = response.data;

					set({
						user,
						token: access_token,
						isAuthenticated: true,
					});

					// Set token in axios defaults
					authApi.setAuthToken(access_token);

					return true;
				} catch (error) {
					console.error("Token refresh failed:", error);
					get().logout();
					return false;
				}
			},

			checkAuth: async () => {
				const { token } = get();
				if (!token) {
					set({ loading: false });
					return;
				}

				set({ loading: true });
				try {
					// Set token in axios defaults
					authApi.setAuthToken(token);

					const response = await authApi.getCurrentUser();
					const { user } = response.data;

					set({
						user,
						isAuthenticated: true,
						loading: false,
					});
				} catch (error) {
					console.error("Auth check failed:", error);
					// Try to refresh token
					const refreshSuccess = await get().refreshAuth();
					if (!refreshSuccess) {
						get().logout();
					}
					set({ loading: false });
				}
			},

			updateUser: (userData) => {
				set((state) => ({
					user: { ...state.user, ...userData },
				}));
			},

			changePassword: async (passwordData) => {
				try {
					await authApi.changePassword(passwordData);
					toast.success("Password berhasil diubah");
					return { success: true };
				} catch (error) {
					const message =
						error.response?.data?.error || "Gagal mengubah password";
					toast.error(message);
					return { success: false, error: message };
				}
			},
		}),
		{
			name: "auth-storage",
			partialize: (state) => ({
				user: state.user,
				token: state.token,
				refreshToken: state.refreshToken,
				isAuthenticated: state.isAuthenticated,
			}),
		}
	)
);

export { useAuthStore };
