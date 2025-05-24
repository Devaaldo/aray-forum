import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Heart, MessageCircle, UserPlus, Repeat2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { usersApi } from "../services/api";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const NotificationsPage = () => {
	const queryClient = useQueryClient();

	// Fetch notifications
	const { data: notifications, isLoading } = useQuery({
		queryKey: ["notifications"],
		queryFn: () => usersApi.getNotifications({ per_page: 50 }),
		select: (response) => response.data.notifications,
	});

	// Mark as read mutation
	const markReadMutation = useMutation({
		mutationFn: (notificationIds) =>
			usersApi.markNotificationsRead(notificationIds),
		onSuccess: () => {
			queryClient.invalidateQueries(["notifications"]);
		},
	});

	const getNotificationIcon = (type) => {
		switch (type) {
			case "like":
				return <Heart size={16} className="text-red-500" />;
			case "comment":
				return <MessageCircle size={16} className="text-blue-500" />;
			case "follow":
				return <UserPlus size={16} className="text-green-500" />;
			case "repost":
				return <Repeat2 size={16} className="text-green-500" />;
			default:
				return <Bell size={16} className="text-gray-500" />;
		}
	};

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

	const handleMarkAllRead = () => {
		const unreadIds =
			notifications
				?.filter((notif) => !notif.is_read)
				.map((notif) => notif.id) || [];

		if (unreadIds.length > 0) {
			markReadMutation.mutate(unreadIds);
		}
	};

	return (
		<div className="min-h-screen bg-white dark:bg-gray-800">
			{/* Header */}
			<div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
				<div className="px-6 py-4">
					<div className="flex items-center justify-between">
						<h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
							<Bell size={24} className="mr-2 text-primary-600" />
							Notifications
						</h1>

						{notifications?.some((notif) => !notif.is_read) && (
							<Button
								size="sm"
								variant="secondary"
								onClick={handleMarkAllRead}
								loading={markReadMutation.isPending}
							>
								Mark all as read
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Notifications List */}
			<div className="divide-y divide-gray-200 dark:divide-gray-700">
				{isLoading ? (
					<div className="flex justify-center py-8">
						<LoadingSpinner size="lg" />
					</div>
				) : notifications?.length === 0 ? (
					<div className="text-center py-12">
						<Bell size={48} className="mx-auto text-gray-400 mb-4" />
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
							No notifications yet
						</h2>
						<p className="text-gray-500 dark:text-gray-400">
							When someone likes, comments, or follows you, you'll see it here.
						</p>
					</div>
				) : (
					notifications?.map((notification) => (
						<div
							key={notification.id}
							className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
								!notification.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
							}`}
						>
							<div className="flex space-x-3">
								<div className="flex-shrink-0">
									{getNotificationIcon(notification.type)}
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<p className="text-sm text-gray-900 dark:text-white">
												{notification.message}
											</p>
											<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
												{formatDate(notification.created_at)}
											</p>
										</div>

										{!notification.is_read && (
											<div className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1"></div>
										)}
									</div>
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
};

export default NotificationsPage;
