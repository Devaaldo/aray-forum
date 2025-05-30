import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Heart,
	MessageCircle,
	Repeat2,
	Share,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { postsApi } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import toast from "react-hot-toast";

const PostCard = ({ post }) => {
	const { user: currentUser } = useAuthStore();
	const queryClient = useQueryClient();
	const [showMenu, setShowMenu] = useState(false);

	// Like mutation
	const likeMutation = useMutation({
		mutationFn: () =>
			post.is_liked ? postsApi.unlikePost(post.id) : postsApi.likePost(post.id),
		onSuccess: () => {
			queryClient.invalidateQueries(["posts"]);
		},
		onError: (error) => {
			toast.error(error.response?.data?.error || "Gagal memproses like");
		},
	});

	// Repost mutation
	const repostMutation = useMutation({
		mutationFn: () =>
			post.is_reposted ? postsApi.unrepost(post.id) : postsApi.repost(post.id),
		onSuccess: () => {
			queryClient.invalidateQueries(["posts"]);
		},
		onError: (error) => {
			toast.error(error.response?.data?.error || "Gagal memproses repost");
		},
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: () => postsApi.deletePost(post.id),
		onSuccess: () => {
			toast.success("Postingan berhasil dihapus");
			queryClient.invalidateQueries(["posts"]);
		},
		onError: (error) => {
			toast.error(error.response?.data?.error || "Gagal menghapus postingan");
		},
	});

	const formatDate = (dateString) => {
		try {
			return formatDistanceToNow(new Date(dateString), {
				addSuffix: true,
				locale: id,
			});
		} catch {
			return "Baru saja";
		}
	};

	const handleShare = async () => {
		try {
			await navigator.share({
				title: `Post by ${post.author.name}`,
				text: post.content,
				url: window.location.href,
			});
		} catch (error) {
			// Fallback to clipboard
			try {
				await navigator.clipboard.writeText(window.location.href);
				toast.success("Link disalin ke clipboard");
			} catch {
				toast.error("Gagal membagikan postingan");
			}
		}
	};

	const isOwner = currentUser?.id === post.author.id;

	return (
		<div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 border-b border-gray-200 dark:border-gray-700">
			<div className="flex space-x-3">
				{/* Avatar */}
				<Link to={`/profile/${post.author.username}`}>
					<Avatar
						src={post.author.avatar_url}
						alt={post.author.name}
						size="md"
						className="cursor-pointer hover:opacity-80 transition-opacity"
					/>
				</Link>

				<div className="flex-1 min-w-0">
					{/* Header */}
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<Link
								to={`/profile/${post.author.username}`}
								className="hover:underline"
							>
								<span className="font-medium text-gray-900 dark:text-white">
									{post.author.name}
								</span>
							</Link>
							<span className="text-gray-500 dark:text-gray-400">
								@{post.author.username}
							</span>
							<span className="text-gray-500 dark:text-gray-400">·</span>
							<span className="text-gray-500 dark:text-gray-400 text-sm">
								{formatDate(post.created_at)}
							</span>
						</div>

						{/* Menu */}
						{isOwner && (
							<div className="relative">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowMenu(!showMenu)}
									className="opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<MoreHorizontal size={16} />
								</Button>

								{showMenu && (
									<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
										<button
											onClick={() => {
												deleteMutation.mutate();
												setShowMenu(false);
											}}
											className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
										>
											<Trash2 size={16} />
											<span>Hapus</span>
										</button>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Content */}
					<div className="mt-2">
						{post.content && (
							<p className="text-gray-900 dark:text-white whitespace-pre-wrap">
								{post.content}
							</p>
						)}

						{/* Media */}
						{post.media_url && post.media_type === "image" && (
							<div className="mt-3">
								<img
									src={post.media_url}
									alt="Post media"
									className="rounded-xl max-h-96 w-full object-cover"
								/>
							</div>
						)}
					</div>

					{/* Actions */}
					<div className="flex items-center justify-between mt-4 max-w-md">
						{/* Comments */}
						<Button
							variant="ghost"
							size="sm"
							className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
						>
							<MessageCircle size={18} />
							<span className="text-sm">{post.comments_count}</span>
						</Button>

						{/* Repost */}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => repostMutation.mutate()}
							loading={repostMutation.isPending}
							className={`flex items-center space-x-2 ${
								post.is_reposted
									? "text-green-600"
									: "text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
							}`}
						>
							<Repeat2 size={18} />
							<span className="text-sm">{post.reposts_count}</span>
						</Button>

						{/* Like */}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => likeMutation.mutate()}
							loading={likeMutation.isPending}
							className={`flex items-center space-x-2 ${
								post.is_liked
									? "text-red-600"
									: "text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
							}`}
						>
							<Heart size={18} fill={post.is_liked ? "currentColor" : "none"} />
							<span className="text-sm">{post.likes_count}</span>
						</Button>

						{/* Share */}
						<Button
							variant="ghost"
							size="sm"
							onClick={handleShare}
							className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
						>
							<Share size={18} />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PostCard;
