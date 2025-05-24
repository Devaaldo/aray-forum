import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
	Home,
	Search,
	Bell,
	User,
	Settings,
	LogOut,
	PenTool,
	Hash,
	Mail,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";

const Sidebar = () => {
	const location = useLocation();
	const { user, logout } = useAuthStore();

	const navigationItems = [
		{ name: "Home", href: "/", icon: Home },
		{ name: "Explore", href: "/explore", icon: Hash },
		{ name: "Notifications", href: "/notifications", icon: Bell },
		{ name: "Messages", href: "/messages", icon: Mail },
		{ name: "Profile", href: `/profile/${user?.username}`, icon: User },
		{ name: "Settings", href: "/settings", icon: Settings },
	];

	const handleLogout = () => {
		logout();
	};

	return (
		<div className="h-full p-6 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
			{/* Logo */}
			<div className="mb-8">
				<Link to="/" className="flex items-center space-x-2">
					<div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
						<span className="text-white font-bold text-lg">A</span>
					</div>
					<span className="hidden xl:block text-xl font-bold text-gray-900 dark:text-white">
						Aray Forum
					</span>
				</Link>
			</div>

			{/* Navigation */}
			<nav className="space-y-2 mb-8">
				{navigationItems.map((item) => {
					const isActive = location.pathname === item.href;
					return (
						<Link key={item.name} to={item.href}>
							<motion.div
								whileHover={{ x: 4 }}
								whileTap={{ scale: 0.98 }}
								className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
									isActive
										? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
										: "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
								}`}
							>
								<item.icon size={24} />
								<span className="hidden xl:block font-medium">{item.name}</span>
							</motion.div>
						</Link>
					);
				})}
			</nav>

			{/* Tweet Button */}
			<div className="mb-8">
				<Button className="w-full xl:w-auto xl:px-8 justify-center" size="lg">
					<PenTool size={20} className="xl:mr-2" />
					<span className="hidden xl:block">Post</span>
				</Button>
			</div>

			{/* User Profile */}
			<div className="mt-auto">
				<div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
					<div className="flex items-center space-x-3">
						<Avatar src={user?.avatar_url} alt={user?.name} size="md" />
						<div className="hidden xl:block">
							<p className="font-medium text-gray-900 dark:text-white">
								{user?.name}
							</p>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								@{user?.username}
							</p>
						</div>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleLogout}
						className="hidden xl:flex"
					>
						<LogOut size={18} />
					</Button>
				</div>
			</div>
		</div>
	);
};

export default Sidebar;
