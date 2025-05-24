import { useState } from "react";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import MobileNav from "./MobileNav";

const Layout = ({ children }) => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			{/* Desktop Layout */}
			<div className="hidden lg:flex max-w-7xl mx-auto">
				{/* Left Sidebar */}
				<div className="w-64 xl:w-80 fixed h-full">
					<Sidebar />
				</div>

				{/* Main Content */}
				<div className="flex-1 ml-64 xl:ml-80 mr-80 xl:mr-96">
					<main className="min-h-screen border-x border-gray-200 dark:border-gray-800">
						{children}
					</main>
				</div>

				{/* Right Sidebar */}
				<div className="w-80 xl:w-96 fixed right-0 h-full">
					<RightSidebar />
				</div>
			</div>

			{/* Mobile Layout */}
			<div className="lg:hidden">
				<main className="pb-16">{children}</main>
				<MobileNav
					isOpen={isMobileMenuOpen}
					onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
				/>
			</div>
		</div>
	);
};

export default Layout;
