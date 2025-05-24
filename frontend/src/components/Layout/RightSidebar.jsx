import { useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../../services/api";
import Input from "../ui/Input";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import LoadingSpinner from "../ui/LoadingSpinner";

const RightSidebar = () => {
	const [searchQuery, setSearchQuery] = useState("");

	// Fetch user suggestions
	const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
		queryKey: ["user-suggestions"],
		queryFn: () => usersApi.getUserSuggestions(),
		select: (response) => response.data.suggestions,
	});

	const trends = [
		{ name: "#ReactJS", posts: "125K" },
		{ name: "#WebDevelopment", posts: "89K" },
		{ name: "#JavaScript", posts: "234K" },
		{ name: "#TailwindCSS", posts: "67K" },
		{ name: "#OpenSource", posts: "156K" },
	];

	return (
		<div className="h-full p-6 space-y-6">
			{/* Search */}
			<div className="card p-4">
				<div className="relative">
					<Search
						size={20}
						className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
					/>
					<Input
						placeholder="Search Aray Forum..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>
			</div>

			{/* Trends */}
			<div className="card p-4">
				<div className="flex items-center space-x-2 mb-4">
					<TrendingUp size={20} className="text-primary-600" />
					<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
						Trending
					</h2>
				</div>
				<div className="space-y-3">
					{trends.map((trend, index) => (
						<div
							key={trend.name}
							className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
						>
							<div>
								<p className="font-medium text-gray-900 dark:text-white">
									{trend.name}
								</p>
								<p className="text-sm text-gray-500 dark:text-gray-400">
									{trend.posts} posts
								</p>
							</div>
							<span className="text-xs text-gray-400">#{index + 1}</span>
						</div>
					))}
				</div>
			</div>

			{/* Who to Follow */}
			<div className="card p-4">
				<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
					Who to Follow
				</h2>
				{suggestionsLoading ? (
					<div className="flex justify-center py-4">
						<LoadingSpinner />
					</div>
				) : (
					<div className="space-y-3">
						{suggestions?.slice(0, 3).map((user) => (
							<div key={user.id} className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<Avatar src={user.avatar_url} alt={user.name} size="md" />
									<div>
										<p className="font-medium text-gray-900 dark:text-white">
											{user.name}
										</p>
										<p className="text-sm text-gray-500 dark:text-gray-400">
											@{user.username}
										</p>
									</div>
								</div>
								<Button size="sm">Follow</Button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default RightSidebar;
