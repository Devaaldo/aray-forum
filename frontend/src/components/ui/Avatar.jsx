import { useState } from "react";
import { User } from "lucide-react";

const Avatar = ({
	src,
	alt = "Avatar",
	size = "md",
	className = "",
	fallback = null,
}) => {
	const [imageError, setImageError] = useState(false);

	const sizeClasses = {
		sm: "avatar-sm",
		md: "avatar-md",
		lg: "avatar-lg",
		xl: "avatar-xl",
	};

	const iconSizes = {
		sm: 16,
		md: 20,
		lg: 24,
		xl: 32,
	};

	if (!src || imageError) {
		return (
			<div
				className={`avatar ${sizeClasses[size]} ${className} flex items-center justify-center bg-gray-200 dark:bg-gray-700`}
			>
				{fallback || (
					<User
						size={iconSizes[size]}
						className="text-gray-500 dark:text-gray-400"
					/>
				)}
			</div>
		);
	}

	return (
		<img
			src={src}
			alt={alt}
			className={`avatar ${sizeClasses[size]} ${className}`}
			onError={() => setImageError(true)}
		/>
	);
};

export default Avatar;
