import { Link, useLocation } from "react-router-dom";
import { Home, Search, Bell, User, Settings } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const MobileNav = () => {
	const location = useLocation();
	const { user } = useAuthStore();

	const navigationItems = [
		{ name: "Home", href: "/", icon: Home },
		{ name: "Explore", href: "/explore", icon: Search },
		{ name: "Notifications", href: "/notifications", icon: Bell },
		{ name: "Profile", href: `/profile/${user?.username}`, icon: User },
		{ name: "Settings", href: "/settings", icon: Settings },
	];

	return (
		<div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-bottom">
			<div className="flex items-center justify-around py-2">
				{navigationItems.map((item) => {
					const isActive = location.pathname === item.href;
					return (
						<Link
							key={item.name}
							to={item.href}
							className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors duration-200 ${
								isActive
									? "text-primary-600 dark:text-primary-400"
									: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
							}`}
						>
							<item.icon size={24} />
							<span className="text-xs font-medium">{item.name}</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
};

export default MobileNav;
