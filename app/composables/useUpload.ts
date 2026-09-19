interface UploadResponse {
  fileId: string;
  fileUrl: string;
  objectKey: string;
}

export function useUpload() {
    const uploading = ref(false);
    const error = ref<string | null>(null);

    async function uploadFile(file: File, folder = "products"): Promise<UploadResponse | null> {
        uploading.value = true;
        error.value = null;

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", folder);

            const response = await $fetch<UploadResponse>("/api/uploads", {
                method: "POST",
                body: formData,
            });

            return response;
        } catch (err: any) {
            error.value = err?.data?.statusMessage || err?.message || "Upload failed";
            return null;
        } finally {
            uploading.value = false;
        }
    }

    return { uploadFile, uploading, error };
}