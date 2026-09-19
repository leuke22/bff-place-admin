export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig().public;

    const formData = await readMultipartFormData(event);

    if (!formData || formData.length === 0) {
        throw createError({ statusCode: 400, statusMessage: "No file provided" });
    }

    const filePart = formData.find((part) => part.name === "file");
    const folderPart = formData.find((part) => part.name === "folder");

    if (!filePart) {
        throw createError({ statusCode: 400, statusMessage: "Missing 'file' field" });
    }

    // Rebuild a FormData to forward to the upload-service
    const forwardForm = new FormData();
    const blob = new Blob([filePart.data], { type: filePart.type });
    forwardForm.append("file", blob, filePart.filename || "upload");

    if (folderPart) {
        forwardForm.append("folder", folderPart.data.toString());
    }

    try {
        const response = await $fetch<{ fileId: string; fileUrl: string; objectKey: string }>(
            `${config.uploadServiceURL}/api/uploads`,
            {
                method: "POST",
                body: forwardForm,
            }
        );

        return response;
    } catch (err: any) {
        throw createError({
            statusCode: err?.response?.status || 500,
            statusMessage: err?.data?.message || "Upload failed",
        });
    }
});