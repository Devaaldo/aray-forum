import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Button from "./Button";

const Modal = ({
	isOpen,
	onClose,
	title,
	children,
	size = "md",
	showCloseButton = true,
}) => {
	const sizeClasses = {
		sm: "max-w-md",
		md: "max-w-lg",
		lg: "max-w-2xl",
		xl: "max-w-4xl",
		full: "max-w-full mx-4",
	};

	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === "Escape") onClose();
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscape);
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "unset";
		};
	}, [isOpen, onClose]);

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0 bg-black/50 backdrop-blur-sm"
					/>

					{/* Modal */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						className={`relative card ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden`}
					>
						{/* Header */}
						{(title || showCloseButton) && (
							<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
								{title && (
									<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
										{title}
									</h2>
								)}
								{showCloseButton && (
									<Button
										variant="ghost"
										size="sm"
										onClick={onClose}
										className="ml-auto"
									>
										<X size={20} />
									</Button>
								)}
							</div>
						)}

						{/* Content */}
						<div className="p-6 overflow-y-auto">{children}</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};

export default Modal;
