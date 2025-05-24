import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { postsApi } from "../services/api";
import CreatePost from "../components/posts/CreatePost";
import PostCard from "../components/posts/PostCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Button from "../components/ui/Button";

const HomePage = () => {
	const [feedType, setFeedType] = useState("timeline"); // 'timeline' or 'explore'

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		error,
	} = useInfiniteQuery({
		queryKey: ["posts", feedType],
		queryFn: ({ pageParam = 1 }) =>
			postsApi.getPosts({
				page: pageParam,
				type: feedType,
				per_page: 10,
			}),
		getNextPageParam: (lastPage) => {
			const { pagination } = lastPage.data;
			return pagination.has_next ? pagination.page + 1 : undefined;
		},
		select: (data) => ({
			pages: data.pages,
			pageParams: data.pageParams,
			posts: data.pages.flatMap((page) => page.data.posts),
		}),
	});

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-64">
				<div className="text-center">
					<p className="text-red-600 dark:text-red-400 mb-4">
						Gagal memuat postingan
					</p>
					<Button onClick={() => window.location.reload()}>Coba Lagi</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white dark:bg-gray-800">
			{/* Header */}
			<div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
				<div className="px-6 py-4">
					<div className="flex items-center justify-between mb-4">
						<h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
							<Sparkles size={24} className="mr-2 text-primary-600" />
							Home
						</h1>
					</div>

					{/* Feed Tabs */}
					<div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
						<button
							onClick={() => setFeedType("timeline")}
							className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
								feedType === "timeline"
									? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
									: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
							}`}
						>
							Following
						</button>
						<button
							onClick={() => setFeedType("explore")}
							className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
								feedType === "explore"
									? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
									: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
							}`}
						>
							For You
						</button>
					</div>
				</div>
			</div>

			{/* Create Post */}
			<div className="border-b border-gray-200 dark:border-gray-700">
				<CreatePost />
			</div>

			{/* Posts Feed */}
			<div className="divide-y divide-gray-200 dark:divide-gray-700">
				{isLoading ? (
					<div className="flex justify-center py-8">
						<LoadingSpinner size="lg" />
					</div>
				) : data?.posts?.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-gray-500 dark:text-gray-400 mb-4">
							{feedType === "timeline"
								? "Belum ada postingan dari pengguna yang Anda ikuti"
								: "Belum ada postingan untuk ditampilkan"}
						</p>
						{feedType === "timeline" && (
							<Button
								variant="secondary"
								onClick={() => setFeedType("explore")}
							>
								Jelajahi Postingan
							</Button>
						)}
					</div>
				) : (
					<>
						{data?.posts?.map((post, index) => (
							<motion.div
								key={post.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
							>
								<PostCard post={post} />
							</motion.div>
						))}

						{/* Load More Button */}
						{hasNextPage && (
							<div className="flex justify-center py-6">
								<Button
									onClick={() => fetchNextPage()}
									loading={isFetchingNextPage}
									variant="secondary"
								>
									{isFetchingNextPage ? "Memuat..." : "Muat Lebih Banyak"}
								</Button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default HomePage;
