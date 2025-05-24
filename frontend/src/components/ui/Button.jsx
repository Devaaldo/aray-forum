import { motion } from "framer-motion";
import LoadingSpinner from "./LoadingSpinner";

const Button = ({
	children,
	variant = "primary",
	size = "md",
	loading = false,
	disabled = false,
	className = "",
	onClick,
	type = "button",
	...props
}) => {
	const baseClasses = "btn focus-ring";
	const variantClasses = {
		primary: "btn-primary",
		secondary: "btn-secondary",
		ghost: "btn-ghost",
		danger: "btn-danger",
	};
	const sizeClasses = {
		sm: "btn-sm",
		md: "btn-md",
		lg: "btn-lg",
	};

	const isDisabled = disabled || loading;

	return (
		<motion.button
			whileHover={!isDisabled ? { scale: 1.02 } : {}}
			whileTap={!isDisabled ? { scale: 0.98 } : {}}
			className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
			disabled={isDisabled}
			onClick={onClick}
			type={type}
			{...props}
		>
			{loading && <LoadingSpinner size="sm" className="mr-2" />}
			{children}
		</motion.button>
	);
};

export default Button;
