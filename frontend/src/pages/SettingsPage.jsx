import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Settings, User, Lock, Palette, Globe, Shield } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import toast from "react-hot-toast";

const SettingsPage = () => {
	const { user, changePassword } = useAuthStore();
	const [activeSection, setActiveSection] = useState("account");
	const [showPasswordModal, setShowPasswordModal] = useState(false);

	const sections = [
		{ id: "account", label: "Account", icon: User },
		{ id: "security", label: "Security", icon: Shield },
		{ id: "privacy", label: "Privacy", icon: Lock },
		{ id: "appearance", label: "Appearance", icon: Palette },
		{ id: "language", label: "Language", icon: Globe },
	];

	const PasswordChangeModal = () => {
		const {
			register,
			handleSubmit,
			formState: { errors },
			reset,
			watch,
		} = useForm();

		const newPassword = watch("newPassword");

		const passwordMutation = useMutation({
			mutationFn: (data) =>
				changePassword({
					current_password: data.currentPassword,
					new_password: data.newPassword,
				}),
			onSuccess: () => {
				toast.success("Password berhasil diubah");
				reset();
				setShowPasswordModal(false);
			},
		});

		const onSubmit = (data) => {
			passwordMutation.mutate(data);
		};

		return (
			<Modal
				isOpen={showPasswordModal}
				onClose={() => setShowPasswordModal(false)}
				title="Change Password"
			>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<Input
						label="Current Password"
						type="password"
						{...register("currentPassword", {
							required: "Current password is required",
						})}
						error={errors.currentPassword?.message}
					/>

					<Input
						label="New Password"
						type="password"
						{...register("newPassword", {
							required: "New password is required",
							minLength: {
								value: 8,
								message: "Password must be at least 8 characters",
							},
						})}
						error={errors.newPassword?.message}
					/>

					<Input
						label="Confirm New Password"
						type="password"
						{...register("confirmPassword", {
							required: "Please confirm your new password",
							validate: (value) =>
								value === newPassword || "Passwords do not match",
						})}
						error={errors.confirmPassword?.message}
					/>

					<div className="flex space-x-3 justify-end pt-4">
						<Button
							type="button"
							variant="secondary"
							onClick={() => setShowPasswordModal(false)}
						>
							Cancel
						</Button>
						<Button type="submit" loading={passwordMutation.isPending}>
							Change Password
						</Button>
					</div>
				</form>
			</Modal>
		);
	};

	return (
		<>
			<div className="min-h-screen bg-white dark:bg-gray-800">
				{/* Header */}
				<div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
					<div className="px-6 py-4">
						<h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
							<Settings size={24} className="mr-2 text-primary-600" />
							Settings
						</h1>
					</div>
				</div>

				<div className="flex">
					{/* Sidebar */}
					<div className="w-64 border-r border-gray-200 dark:border-gray-700 min-h-screen">
						<nav className="p-4 space-y-2">
							{sections.map((section) => (
								<button
									key={section.id}
									onClick={() => setActiveSection(section.id)}
									className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
										activeSection === section.id
											? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
											: "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
									}`}
								>
									<section.icon size={20} />
									<span>{section.label}</span>
								</button>
							))}
						</nav>
					</div>

					{/* Content */}
					<div className="flex-1 p-6">
						{activeSection === "account" && (
							<div className="space-y-6">
								<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
									Account Information
								</h2>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
											Name
										</label>
										<p className="text-gray-900 dark:text-white">
											{user?.name}
										</p>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
											Username
										</label>
										<p className="text-gray-900 dark:text-white">
											@{user?.username}
										</p>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
											Email
										</label>
										<p className="text-gray-900 dark:text-white">
											{user?.email}
										</p>
									</div>
								</div>
							</div>
						)}

						{activeSection === "security" && (
							<div className="space-y-6">
								<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
									Security Settings
								</h2>
								<div className="space-y-4">
									<div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
										<div>
											<h3 className="font-medium text-gray-900 dark:text-white">
												Password
											</h3>
											<p className="text-sm text-gray-500 dark:text-gray-400">
												Change your account password
											</p>
										</div>
										<Button
											variant="secondary"
											onClick={() => setShowPasswordModal(true)}
										>
											Change
										</Button>
									</div>
								</div>
							</div>
						)}

						{/* Add other sections as needed */}
					</div>
				</div>
			</div>

			<PasswordChangeModal />
		</>
	);
};

export default SettingsPage;
