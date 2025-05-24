import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Calendar,
	MapPin,
	Link as LinkIcon,
	Settings,
	Camera,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { usersApi, postsApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import PostCard from "../components/posts/PostCard";
import Modal from "../components/ui/Modal";
import EditProfileModal from "../components/profile/EditProfileModal";

const ProfilePage = () => {
	const { username } = useParams();
	const { user: currentUser } = useAuthStore();
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState("posts");
	const [showEditModal, setShowEditModal] = useState(false);

	const targetUsername = username || currentUser?.username;
	const isOwnProfile = !username || username === currentUser?.username;

	// Fetch user profile
	const { data: profileData, isLoading: profileLoading } = useQuery({
		queryKey: ["user-profile", targetUsername],
		queryFn: () => usersApi.getUserByUsername(targetUsername),
		select: (response) => response.data.user,
		enabled: !!targetUsername,
	});

	// Fetch user posts
	const { data: postsData, isLoading: postsLoading } = useQuery({
		queryKey: ["user-posts", profileData?.id],
		queryFn: () =>
			postsApi.getPosts({
				type: "user",
				user_id: profileData?.id,
				per_page: 20,
			}),
		select: (response) => response.data.posts,
		enabled: !!profileData?.id,
	});

	// Follow/Unfollow mutation
	const followMutation = useMutation({
		mutationFn: () =>
			profileData?.is_following
				? usersApi.unfollowUser(profileData.id)
				: usersApi.followUser(profileData.id),
		onSuccess: () => {
			queryClient.invalidateQueries(["user-profile", targetUsername]);
		},
	});

	if (profileLoading) {
		return (
			<div className="flex justify-center items-center min-h-64">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (!profileData) {
		return (
			<div className="text-center py-12">
				<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
					Pengguna tidak ditemukan
				</h2>
				<p className="text-gray-500 dark:text-gray-400">
					Pengguna yang Anda cari tidak ada atau telah dihapus.
				</p>
			</div>
		);
	}

	const formatJoinDate = (dateString) => {
		try {
			return formatDistanceToNow(new Date(dateString), {
				addSuffix: true,
				locale: id,
			});
		} catch {
			return "Bergabung baru-baru ini";
		}
	};

	const tabs = [
		{ id: "posts", label: "Posts", count: profileData.posts_count },
		{ id: "replies", label: "Replies", count: null },
		{ id: "media", label: "Media", count: null },
		{ id: "likes", label: "Likes", count: null },
	];

	return (
		<>
			<div className="min-h-screen bg-white dark:bg-gray-800">
				{/* Header */}
				<div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
					<div className="px-6 py-4">
						<div className="flex items-center space-x-4">
							<h1 className="text-xl font-bold text-gray-900 dark:text-white">
								{profileData.name}
							</h1>
							<span className="text-sm text-gray-500 dark:text-gray-400">
								{profileData.posts_count} posts
							</span>
						</div>
					</div>
				</div>

				{/* Profile Header */}
				<div className="relative">
					{/* Banner */}
					<div className="h-48 sm:h-64 bg-gradient-to-r from-primary-400 to-primary-600 relative">
						{profileData.banner_url && (
							<img
								src={profileData.banner_url}
								alt="Profile banner"
								className="w-full h-full object-cover"
							/>
						)}
						{isOwnProfile && (
							<button className="absolute bottom-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
								<Camera size={20} />
							</button>
						)}
					</div>

					{/* Profile Info */}
					<div className="px-6 pb-6">
						<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 sm:-mt-20">
							{/* Avatar */}
							<div className="relative">
								<Avatar
									src={profileData.avatar_url}
									alt={profileData.name}
									size="xl"
									className="border-4 border-white dark:border-gray-800 w-24 h-24 sm:w-32 sm:h-32"
								/>
								{isOwnProfile && (
									<button className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors">
										<Camera size={16} />
									</button>
								)}
							</div>

							{/* Action Buttons */}
							<div className="mt-4 sm:mt-0 flex space-x-3">
								{isOwnProfile ? (
									<Button
										variant="secondary"
										onClick={() => setShowEditModal(true)}
										className="flex items-center space-x-2"
									>
										<Settings size={16} />
										<span>Edit Profile</span>
									</Button>
								) : (
									<Button
										onClick={() => followMutation.mutate()}
										loading={followMutation.isPending}
										variant={profileData.is_following ? "secondary" : "primary"}
									>
										{profileData.is_following ? "Unfollow" : "Follow"}
									</Button>
								)}
							</div>
						</div>

						{/* User Info */}
						<div className="mt-4 space-y-3">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-white">
									{profileData.name}
								</h2>
								<p className="text-gray-500 dark:text-gray-400">
									@{profileData.username}
								</p>
							</div>

							{profileData.bio && (
								<p className="text-gray-900 dark:text-white">
									{profileData.bio}
								</p>
							)}

							{/* Meta Info */}
							<div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
								{profileData.location && (
									<div className="flex items-center space-x-1">
										<MapPin size={16} />
										<span>{profileData.location}</span>
									</div>
								)}
								{profileData.website && (
									<div className="flex items-center space-x-1">
										<LinkIcon size={16} />
										<a
											href={profileData.website}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary-600 hover:underline"
										>
											{profileData.website}
										</a>
									</div>
								)}
								<div className="flex items-center space-x-1">
									<Calendar size={16} />
									<span>
										Bergabung {formatJoinDate(profileData.created_at)}
									</span>
								</div>
							</div>

							{/* Stats */}
							<div className="flex space-x-6">
								<div className="flex items-center space-x-1">
									<span className="font-bold text-gray-900 dark:text-white">
										{profileData.following_count}
									</span>
									<span className="text-gray-500 dark:text-gray-400">
										Following
									</span>
								</div>
								<div className="flex items-center space-x-1">
									<span className="font-bold text-gray-900 dark:text-white">
										{profileData.followers_count}
									</span>
									<span className="text-gray-500 dark:text-gray-400">
										Followers
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Tabs */}
				<div className="border-b border-gray-200 dark:border-gray-700">
					<div className="flex">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex-1 py-4 px-4 text-center font-medium transition-colors border-b-2 ${
									activeTab === tab.id
										? "text-primary-600 border-primary-600"
										: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-transparent"
								}`}
							>
								{tab.label}
								{tab.count !== null && (
									<span className="ml-1">({tab.count})</span>
								)}
							</button>
						))}
					</div>
				</div>

				{/* Content */}
				<div className="divide-y divide-gray-200 dark:divide-gray-700">
					{postsLoading ? (
						<div className="flex justify-center py-8">
							<LoadingSpinner size="lg" />
						</div>
					) : postsData?.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-gray-500 dark:text-gray-400">
								{isOwnProfile
									? "Anda belum membuat postingan"
									: `${profileData.name} belum membuat postingan`}
							</p>
						</div>
					) : (
						postsData?.map((post) => <PostCard key={post.id} post={post} />)
					)}
				</div>
			</div>

			{/* Edit Profile Modal */}
			{showEditModal && (
				<EditProfileModal
					isOpen={showEditModal}
					onClose={() => setShowEditModal(false)}
					user={profileData}
				/>
			)}
		</>
	);
};

export default ProfilePage;
