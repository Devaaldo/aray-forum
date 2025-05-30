import axios from "axios";

// Create axios instance
const api = axios.create({
	baseURL: "/api",
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor to add auth token
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("auth-storage");
		if (token) {
			try {
				const parsedData = JSON.parse(token);
				if (parsedData.state?.token) {
					config.headers.Authorization = `Bearer ${parsedData.state.token}`;
				}
			} catch (error) {
				console.error("Error parsing auth token:", error);
			}
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			// Token expired or invalid
			localStorage.removeItem("auth-storage");
			window.location.href = "/auth";
		}
		return Promise.reject(error);
	}
);

// Auth API
export const authApi = {
	setAuthToken: (token) => {
		if (token) {
			api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
		} else {
			delete api.defaults.headers.common["Authorization"];
		}
	},

	register: (userData) => api.post("/auth/register", userData),

	login: (credentials) => api.post("/auth/login", credentials),

	logout: () => api.post("/auth/logout"),

	refresh: (refreshToken) =>
		api.post("/auth/refresh", { refresh_token: refreshToken }),

	getCurrentUser: () => api.get("/auth/me"),

	changePassword: (passwordData) =>
		api.post("/auth/change-password", passwordData),
};

// Posts API
export const postsApi = {
	getPosts: (params = {}) => api.get("/posts", { params }),

	createPost: (postData) => api.post("/posts", postData),

	getPost: (postId) => api.get(`/posts/${postId}`),

	deletePost: (postId) => api.delete(`/posts/${postId}`),

	likePost: (postId) => api.post(`/posts/${postId}/like`),

	unlikePost: (postId) => api.post(`/posts/${postId}/unlike`),

	repost: (postId) => api.post(`/posts/${postId}/repost`),

	unrepost: (postId) => api.post(`/posts/${postId}/unrepost`),

	getComments: (postId, params = {}) =>
		api.get(`/posts/${postId}/comments`, { params }),

	createComment: (postId, commentData) =>
		api.post(`/posts/${postId}/comments`, commentData),

	searchPosts: (query, params = {}) =>
		api.get("/posts/search", {
			params: { q: query, ...params },
		}),
};

// Users API
export const usersApi = {
	getUser: (userId) => api.get(`/users/${userId}`),

	getUserByUsername: (username) => api.get(`/users/${username}`),

	updateProfile: (userData) => api.put("/users/me", userData),

	followUser: (userId) => api.post(`/users/${userId}/follow`),

	unfollowUser: (userId) => api.post(`/users/${userId}/unfollow`),

	getFollowers: (userId, params = {}) =>
		api.get(`/users/${userId}/followers`, { params }),

	getFollowing: (userId, params = {}) =>
		api.get(`/users/${userId}/following`, { params }),

	searchUsers: (query, params = {}) =>
		api.get("/users/search", {
			params: { q: query, ...params },
		}),

	getUserSuggestions: () => api.get("/users/suggestions"),

	getNotifications: (params = {}) =>
		api.get("/users/notifications", { params }),

	markNotificationsRead: (notificationIds = []) =>
		api.post("/users/notifications/mark-read", {
			notification_ids: notificationIds,
		}),
};

// Upload API
export const uploadApi = {
	uploadImage: (file) => {
		const formData = new FormData();
		formData.append("file", file);
		return api.post("/upload/image", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
	},

	uploadAvatar: (file) => {
		const formData = new FormData();
		formData.append("file", file);
		return api.post("/upload/avatar", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
	},

	uploadBanner: (file) => {
		const formData = new FormData();
		formData.append("file", file);
		return api.post("/upload/banner", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
	},

	deleteFile: (filename) => api.post("/upload/delete", { filename }),

	cleanupFiles: () => api.post("/upload/cleanup"),
};

export default api;
