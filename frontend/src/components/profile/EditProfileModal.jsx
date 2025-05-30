import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, X } from "lucide-react";
import { usersApi, uploadApi } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import toast from "react-hot-toast";

const EditProfileModal = ({ isOpen, onClose, user }) => {
	const { updateUser } = useAuthStore();
	const queryClient = useQueryClient();
	const [avatarFile, setAvatarFile] = useState(null);
	const [avatarPreview, setAvatarPreview] = useState(null);
	const [bannerFile, setBannerFile] = useState(null);
	const [bannerPreview, setBannerPreview] = useState(null);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm({
		defaultValues: {
			name: user?.name || "",
			bio: user?.bio || "",
			location: user?.location || "",
			website: user?.website || "",
		},
	});

	// Upload avatar mutation
	const uploadAvatarMutation = useMutation({
		mutationFn: (file) => uploadApi.uploadAvatar(file),
		onError: () => {
			toast.error("Gagal mengupload avatar");
		},
	});

	// Upload banner mutation
	const uploadBannerMutation = useMutation({
		mutationFn: (file) => uploadApi.uploadBanner(file),
		onError: () => {
			toast.error("Gagal mengupload banner");
		},
	});

	// Update profile mutation
	const updateProfileMutation = useMutation({
		mutationFn: (profileData) => usersApi.updateProfile(profileData),
		onSuccess: (response) => {
			const updatedUser = response.data.user;
			updateUser(updatedUser);
			toast.success("Profil berhasil diperbarui");
			queryClient.invalidateQueries(["user-profile"]);
			onClose();
			reset();
		},
		onError: (error) => {
			const message = error.response?.data?.error || "Gagal memperbarui profil";
			toast.error(message);
		},
	});

	const handleAvatarChange = (event) => {
		const file = event.target.files[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				// 5MB limit
				toast.error("Ukuran avatar maksimal 5MB");
				return;
			}

			setAvatarFile(file);
			const reader = new FileReader();
			reader.onload = () => setAvatarPreview(reader.result);
			reader.readAsDataURL(file);
		}
	};

	const handleBannerChange = (event) => {
		const file = event.target.files[0];
		if (file) {
			if (file.size > 10 * 1024 * 1024) {
				// 10MB limit
				toast.error("Ukuran banner maksimal 10MB");
				return;
			}

			setBannerFile(file);
			const reader = new FileReader();
			reader.onload = () => setBannerPreview(reader.result);
			reader.readAsDataURL(file);
		}
	};

	const onSubmit = async (data) => {
		try {
			let avatarUrl = user?.avatar_url;
			let bannerUrl = user?.banner_url;

			// Upload avatar if changed
			if (avatarFile) {
				const avatarResponse = await uploadAvatarMutation.mutateAsync(
					avatarFile
				);
				avatarUrl = avatarResponse.data.avatar_url;
			}

			// Upload banner if changed
			if (bannerFile) {
				const bannerResponse = await uploadBannerMutation.mutateAsync(
					bannerFile
				);
				bannerUrl = bannerResponse.data.banner_url;
			}

			// Update profile
			await updateProfileMutation.mutateAsync({
				...data,
				avatar_url: avatarUrl,
				banner_url: bannerUrl,
			});
		} catch (error) {
			console.error("Error updating profile:", error);
		}
	};

	const handleClose = () => {
		reset();
		setAvatarFile(null);
		setAvatarPreview(null);
		setBannerFile(null);
		setBannerPreview(null);
		onClose();
	};

	const isLoading =
		updateProfileMutation.isPending ||
		uploadAvatarMutation.isPending ||
		uploadBannerMutation.isPending;

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Edit Profile" size="lg">
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				{/* Banner Upload */}
				<div className="relative">
					<div className="h-32 bg-gradient-to-r from-primary-400 to-primary-600 rounded-lg overflow-hidden">
						{bannerPreview || user?.banner_url ? (
							<img
								src={bannerPreview || user?.banner_url}
								alt="Banner"
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center">
								<span className="text-white text-sm">No banner</span>
							</div>
						)}
					</div>
					<label className="absolute bottom-2 right-2 p-2 bg-black/50 text-white rounded-full cursor-pointer hover:bg-black/70 transition-colors">
						<Camera size={16} />
						<input
							type="file"
							accept="image/*"
							onChange={handleBannerChange}
							className="hidden"
						/>
					</label>
					{(bannerPreview || user?.banner_url) && (
						<button
							type="button"
							onClick={() => {
								setBannerFile(null);
								setBannerPreview(null);
							}}
							className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
						>
							<X size={14} />
						</button>
					)}
				</div>

				{/* Avatar Upload */}
				<div className="flex justify-center -mt-8">
					<div className="relative">
						<Avatar
							src={avatarPreview || user?.avatar_url}
							alt={user?.name}
							size="xl"
							className="border-4 border-white dark:border-gray-800 w-20 h-20"
						/>
						<label className="absolute bottom-0 right-0 p-1.5 bg-primary-600 text-white rounded-full cursor-pointer hover:bg-primary-700 transition-colors">
							<Camera size={12} />
							<input
								type="file"
								accept="image/*"
								onChange={handleAvatarChange}
								className="hidden"
							/>
						</label>
					</div>
				</div>

				{/* Form Fields */}
				<div className="space-y-4">
					<Input
						label="Name"
						{...register("name", {
							required: "Nama wajib diisi",
							minLength: {
								value: 1,
								message: "Nama minimal 1 karakter",
							},
							maxLength: {
								value: 100,
								message: "Nama maksimal 100 karakter",
							},
						})}
						error={errors.name?.message}
					/>

					<Textarea
						label="Bio"
						{...register("bio", {
							maxLength: {
								value: 160,
								message: "Bio maksimal 160 karakter",
							},
						})}
						rows={3}
						placeholder="Tell the world about yourself"
						error={errors.bio?.message}
					/>

					<Input
						label="Location"
						{...register("location", {
							maxLength: {
								value: 100,
								message: "Lokasi maksimal 100 karakter",
							},
						})}
						placeholder="Where are you based?"
						error={errors.location?.message}
					/>

					<Input
						label="Website"
						{...register("website", {
							maxLength: {
								value: 200,
								message: "Website maksimal 200 karakter",
							},
							pattern: {
								value: /^https?:\/\/.+/,
								message: "Website harus dimulai dengan http:// atau https://",
							},
						})}
						placeholder="https://yourwebsite.com"
						error={errors.website?.message}
					/>
				</div>

				{/* Actions */}
				<div className="flex space-x-3 justify-end pt-4">
					<Button
						type="button"
						variant="secondary"
						onClick={handleClose}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button type="submit" loading={isLoading} disabled={isLoading}>
						Save Changes
					</Button>
				</div>
			</form>
		</Modal>
	);
};

export default EditProfileModal;
