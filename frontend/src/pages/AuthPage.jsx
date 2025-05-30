import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, AtSign } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const AuthPage = () => {
	const [isLogin, setIsLogin] = useState(true);
	const [showPassword, setShowPassword] = useState(false);
	const { login, register: registerUser, loading } = useAuthStore();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		watch,
	} = useForm();

	const password = watch("password");

	const onSubmit = async (data) => {
		let result;
		if (isLogin) {
			result = await login({
				email_or_username: data.emailOrUsername,
				password: data.password,
			});
		} else {
			result = await registerUser({
				name: data.name,
				email: data.email,
				username: data.username,
				password: data.password,
			});
		}

		if (result.success) {
			reset();
		}
	};

	const toggleMode = () => {
		setIsLogin(!isLogin);
		reset();
		setShowPassword(false);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="w-full max-w-md"
			>
				{/* Logo */}
				<div className="text-center mb-8">
					<div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
						<span className="text-white font-bold text-2xl">A</span>
					</div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
						Aray Forum
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						{isLogin ? "Masuk ke akun Anda" : "Bergabung dengan komunitas kami"}
					</p>
				</div>

				{/* Form */}
				<motion.div
					key={isLogin ? "login" : "register"}
					initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.3 }}
					className="card p-8"
				>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						{!isLogin && (
							<>
								{/* Name Field */}
								<div className="relative">
									<User
										size={20}
										className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
									/>
									<Input
										{...register("name", {
											required: "Nama wajib diisi",
											minLength: {
												value: 2,
												message: "Nama minimal 2 karakter",
											},
											maxLength: {
												value: 100,
												message: "Nama maksimal 100 karakter",
											},
										})}
										placeholder="Nama lengkap"
										className="pl-10"
										error={errors.name?.message}
									/>
								</div>

								{/* Email Field */}
								<div className="relative">
									<Mail
										size={20}
										className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
									/>
									<Input
										{...register("email", {
											required: "Email wajib diisi",
											pattern: {
												value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
												message: "Format email tidak valid",
											},
										})}
										type="email"
										placeholder="Email"
										className="pl-10"
										error={errors.email?.message}
									/>
								</div>

								{/* Username Field */}
								<div className="relative">
									<AtSign
										size={20}
										className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
									/>
									<Input
										{...register("username", {
											required: "Username wajib diisi",
											minLength: {
												value: 3,
												message: "Username minimal 3 karakter",
											},
											maxLength: {
												value: 30,
												message: "Username maksimal 30 karakter",
											},
											pattern: {
												value: /^[a-zA-Z0-9_]+$/,
												message:
													"Username hanya boleh mengandung huruf, angka, dan underscore",
											},
										})}
										placeholder="Username"
										className="pl-10"
										error={errors.username?.message}
									/>
								</div>
							</>
						)}

						{isLogin && (
							/* Email/Username Field for Login */
							<div className="relative">
								<Mail
									size={20}
									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
								/>
								<Input
									{...register("emailOrUsername", {
										required: "Email atau username wajib diisi",
									})}
									placeholder="Email atau username"
									className="pl-10"
									error={errors.emailOrUsername?.message}
								/>
							</div>
						)}

						{/* Password Field */}
						<div className="relative">
							<Lock
								size={20}
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
							/>
							<Input
								{...register("password", {
									required: "Password wajib diisi",
									...(isLogin
										? {}
										: {
												minLength: {
													value: 8,
													message: "Password minimal 8 karakter",
												},
												pattern: {
													value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
													message:
														"Password harus mengandung huruf besar, huruf kecil, dan angka",
												},
										  }),
								})}
								type={showPassword ? "text" : "password"}
								placeholder="Password"
								className="pl-10 pr-10"
								error={errors.password?.message}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
							>
								{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
							</button>
						</div>

						{!isLogin && (
							/* Confirm Password Field */
							<div className="relative">
								<Lock
									size={20}
									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
								/>
								<Input
									{...register("confirmPassword", {
										required: "Konfirmasi password wajib diisi",
										validate: (value) =>
											value === password || "Password tidak sama",
									})}
									type={showPassword ? "text" : "password"}
									placeholder="Konfirmasi password"
									className="pl-10"
									error={errors.confirmPassword?.message}
								/>
							</div>
						)}

						{/* Submit Button */}
						<Button
							type="submit"
							className="w-full"
							size="lg"
							loading={loading}
							disabled={loading}
						>
							{loading ? (
								<LoadingSpinner size="sm" />
							) : isLogin ? (
								"Masuk"
							) : (
								"Daftar"
							)}
						</Button>
					</form>

					{/* Toggle Mode */}
					<div className="mt-6 text-center">
						<p className="text-gray-600 dark:text-gray-400">
							{isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
							<button
								type="button"
								onClick={toggleMode}
								className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
							>
								{isLogin ? "Daftar disini" : "Masuk disini"}
							</button>
						</p>
					</div>
				</motion.div>

				{/* Footer */}
				<div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
					<p>
						Dengan menggunakan Aray Forum, Anda menyetujui{" "}
						<a href="#" className="text-primary-600 hover:underline">
							Syarat & Ketentuan
						</a>{" "}
						dan{" "}
						<a href="#" className="text-primary-600 hover:underline">
							Kebijakan Privasi
						</a>
					</p>
				</div>
			</motion.div>
		</div>
	);
};

export default AuthPage;
