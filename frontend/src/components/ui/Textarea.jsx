import { forwardRef } from "react";
import { motion } from "framer-motion";

const Textarea = forwardRef(
	({ label, error, className = "", rows = 3, ...props }, ref) => {
		return (
			<div className="space-y-1">
				{label && (
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
						{label}
					</label>
				)}
				<motion.textarea
					ref={ref}
					rows={rows}
					className={`input resize-none ${
						error ? "input-error" : ""
					} ${className}`}
					initial={{ scale: 1 }}
					whileFocus={{ scale: 1.01 }}
					transition={{ duration: 0.2 }}
					{...props}
				/>
				{error && (
					<motion.p
						initial={{ opacity: 0, y: -5 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-sm text-red-600 dark:text-red-400"
					>
						{error}
					</motion.p>
				)}
			</div>
		);
	}
);

Textarea.displayName = "Textarea";

export default Textarea;
