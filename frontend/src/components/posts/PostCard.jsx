import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { postsApi, uploadApi } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import Button from "../ui/Button";
import Textarea from "../ui/Textarea";
import Avatar from "../ui/Avatar";
import toast from "react-hot-toast";

const CreatePost = () => {
	const { user } = useAuthStore();
	const queryClient = useQueryClient();
	const [uploadedImage, setUploadedImage] = useState(null);
	const [imagePreview, setImagePreview] = useState(null);

	const { register, handleSubmit, watch, reset, setValue } = useForm();
	const content = watch("content", "");

	// Upload image mutation
	const uploadMutation = useMutation({
		mutationFn: (file) => uploadApi.uploadImage(file),
		onSuccess: (response) => {
			setUploadedImage(response.data.file_url);
		},
		onError: () => {
			toast.error("Gagal mengupload gambar");
			setImagePreview(null);
		},
	});

	// Create post mutation
	const createPostMutation = useMutation({
		mutationFn: (postData) => postsApi.createPost(postData),
		onSuccess: () => {
			toast.success("Postingan berhasil dibuat!");
			reset();
			setUploadedImage(null);
			setImagePreview(null);
			queryClient.invalidateQueries(["posts"]);
		},
		onError: (error) => {
			const message = error.response?.data?.error || "Gagal membuat postingan";
			toast.error(message);
		},
	});

	const onDrop = (acceptedFiles) => {
		const file = acceptedFiles[0];
		if (file) {
			// Create preview
			const reader = new FileReader();
			reader.onload = () => setImagePreview(reader.result);
			reader.readAsDataURL(file);

			// Upload file
			uploadMutation.mutate(file);
		}
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/*": [".png", ".jpg", ".jpeg", ".gif"],
		},
		maxFiles: 1,
		maxSize: 16 * 1024 * 1024, // 16MB
	});

	const onSubmit = (data) => {
		if (!data.content.trim() && !uploadedImage) {
			toast.error("Konten atau gambar wajib diisi");
			return;
		}

		createPostMutation.mutate({
			content: data.content.trim(),
			media_url: uploadedImage,
			media_type: uploadedImage ? "image" : null,
		});
	};

	const removeImage = () => {
		setImagePreview(null);
		setUploadedImage(null);
	};

	const isLoading = createPostMutation.isPending || uploadMutation.isPending;
	const characterCount = content.length;
	const isOverLimit = characterCount > 280;

	return (
		<div className="p-6">
			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="flex space-x-4">
					<Avatar src={user?.avatar_url} alt={user?.name} size="md" />

					<div className="flex-1 space-y-4">
						<Textarea
							{...register("content")}
							placeholder="Apa yang sedang terjadi?"
							rows={3}
							className="text-lg resize-none border-none focus:ring-0 p-0"
						/>

						{/* Image Preview */}
						{imagePreview && (
							<div className="relative inline-block">
								<img
									src={imagePreview}
									alt="Preview"
									className="rounded-xl max-h-64 object-cover"
								/>
								<button
									type="button"
									onClick={removeImage}
									className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
								>
									<X size={16} />
								</button>
							</div>
						)}

						{/* Actions */}
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-4">
								{/* Image Upload */}
								<div {...getRootProps()}>
									<input {...getInputProps()} />
									<button
										type="button"
										className={`p-2 rounded-full transition-colors duration-200 ${
											isDragActive
												? "text-primary-600 bg-primary-100"
												: "text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
										}`}
										disabled={uploadMutation.isPending}
									>
										<Image size={20} />
									</button>
								</div>
							</div>

							<div className="flex items-center space-x-4">
								{/* Character Count */}
								{content && (
									<div
										className={`text-sm ${
											isOverLimit
												? "text-red-500"
												: characterCount > 240
												? "text-yellow-500"
												: "text-gray-500"
										}`}
									>
										{280 - characterCount}
									</div>
								)}

								{/* Submit Button */}
								<Button
									type="submit"
									loading={isLoading}
									disabled={(!content.trim() && !uploadedImage) || isOverLimit}
								>
									Post
								</Button>
							</div>
						</div>
					</div>
				</div>
			</form>
		</div>
	);
};

export default CreatePost;
