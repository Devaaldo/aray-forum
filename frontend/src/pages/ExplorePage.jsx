import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, TrendingUp, Users } from "lucide-react";
import { postsApi, usersApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import Input from "../components/ui/Input";
import PostCard from "../components/posts/PostCard";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const ExplorePage = () => {
	const [activeTab, setActiveTab] = useState("posts");
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState(null);
	const [isSearching, setIsSearching] = useState(false);

	// Fetch trending posts
	const { data: trendingPosts, isLoading: postsLoading } = useQuery({
		queryKey: ["trending-posts"],
		queryFn: () => postsApi.getPosts({ type: "explore", per_page: 20 }),
		select: (response) => response.data.posts,
	});

	// Fetch suggested users
	const { data: suggestedUsers, isLoading: usersLoading } = useQuery({
		queryKey: ["suggested-users"],
		queryFn: () => usersApi.getUserSuggestions(),
		select: (response) => response.data.suggestions,
	});

	const handleSearch = async (query) => {
		if (!query.trim()) {
			setSearchResults(null);
			return;
		}

		setIsSearching(true);
		try {
			const [postsResponse, usersResponse] = await Promise.all([
				postsApi.searchPosts(query),
				usersApi.searchUsers(query),
			]);

			setSearchResults({
				posts: postsResponse.data.posts,
				users: usersResponse.data.users,
			});
		} catch (error) {
			console.error("Search error:", error);
		} finally {
			setIsSearching(false);
		}
	};

	const tabs = [
		{ id: "posts", label: "Posts", icon: TrendingUp },
		{ id: "users", label: "People", icon: Users },
	];

	return (
		<div className="min-h-screen bg-white dark:bg-gray-800">
			{/* Header */}
			<div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
				<div className="px-6 py-4">
					<div className="flex items-center space-x-4">
						<h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
							<Search size={24} className="mr-2 text-primary-600" />
							Explore
						</h1>

						{/* Search Input */}
						<div className="flex-1 relative">
							<Search
								size={20}
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
							/>
							<Input
								placeholder="Search posts and people..."
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									if (e.target.value.length > 2) {
										handleSearch(e.target.value);
									} else {
										setSearchResults(null);
									}
								}}
								className="pl-10"
							/>
						</div>
					</div>

					{/* Tabs */}
					<div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mt-4">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
									activeTab === tab.id
										? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
										: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
								}`}
							>
								<tab.icon size={16} />
								<span>{tab.label}</span>
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="divide-y divide-gray-200 dark:divide-gray-700">
				{isSearching ? (
					<div className="flex justify-center py-8">
						<LoadingSpinner size="lg" />
					</div>
				) : searchResults ? (
					// Search Results
					<div>
						{activeTab === "posts" ? (
							searchResults.posts.length === 0 ? (
								<div className="text-center py-12">
									<p className="text-gray-500 dark:text-gray-400">
										Tidak ada postingan ditemukan untuk "{searchQuery}"
									</p>
								</div>
							) : (
								searchResults.posts.map((post) => (
									<PostCard key={post.id} post={post} />
								))
							)
						) : (
							// Users Results
							<div className="p-6">
								{searchResults.users.length === 0 ? (
									<div className="text-center py-12">
										<p className="text-gray-500 dark:text-gray-400">
											Tidak ada pengguna ditemukan untuk "{searchQuery}"
										</p>
									</div>
								) : (
									<div className="space-y-4">
										{searchResults.users.map((user) => (
											<UserSuggestionCard key={user.id} user={user} />
										))}
									</div>
								)}
							</div>
						)}
					</div>
				) : (
					// Default Content
					<div>
						{activeTab === "posts" ? (
							// Trending Posts
							postsLoading ? (
								<div className="flex justify-center py-8">
									<LoadingSpinner size="lg" />
								</div>
							) : trendingPosts?.length === 0 ? (
								<div className="text-center py-12">
									<p className="text-gray-500 dark:text-gray-400">
										Belum ada postingan trending
									</p>
								</div>
							) : (
								trendingPosts?.map((post) => (
									<PostCard key={post.id} post={post} />
								))
							)
						) : (
							// Suggested Users
							<div className="p-6">
								{usersLoading ? (
									<div className="flex justify-center py-8">
										<LoadingSpinner size="lg" />
									</div>
								) : suggestedUsers?.length === 0 ? (
									<div className="text-center py-12">
										<p className="text-gray-500 dark:text-gray-400">
											Tidak ada saran pengguna saat ini
										</p>
									</div>
								) : (
									<div className="space-y-4">
										<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
											Suggested for you
										</h2>
										{suggestedUsers?.map((user) => (
											<UserSuggestionCard key={user.id} user={user} />
										))}
									</div>
								)}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

// User Suggestion Card Component
const UserSuggestionCard = ({ user }) => {
	const { user: currentUser } = useAuthStore();
	const queryClient = useQueryClient();

	const followMutation = useMutation({
		mutationFn: () =>
			user.is_following
				? usersApi.unfollowUser(user.id)
				: usersApi.followUser(user.id),
		onSuccess: () => {
			queryClient.invalidateQueries(["suggested-users"]);
		},
	});

	if (user.id === currentUser?.id) return null;

	return (
		<div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
			<div className="flex items-center space-x-3">
				<Avatar src={user.avatar_url} alt={user.name} size="md" />
				<div>
					<h3 className="font-medium text-gray-900 dark:text-white">
						{user.name}
					</h3>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						@{user.username}
					</p>
					{user.bio && (
						<p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate-2">
							{user.bio}
						</p>
					)}
				</div>
			</div>

			<Button
				size="sm"
				variant={user.is_following ? "secondary" : "primary"}
				onClick={() => followMutation.mutate()}
				loading={followMutation.isPending}
			>
				{user.is_following ? "Unfollow" : "Follow"}
			</Button>
		</div>
	);
};

export default ExplorePage;
