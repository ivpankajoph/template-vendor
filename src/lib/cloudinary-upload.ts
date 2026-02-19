import { NEXT_PUBLIC_API_URL } from "@/config/variables";

export type UploadedCloudinaryImage = {
  url: string;
  publicId: string;
};

type SignatureResponse = {
  timestamp: number;
  signature: string;
  folder: string;
  cloudName: string;
  apiKey: string;
};

export const uploadImageToCloudinary = async (
  file: File,
  folder = "ophmate/reviews",
): Promise<UploadedCloudinaryImage> => {
  if (!NEXT_PUBLIC_API_URL) {
    throw new Error("API URL is not configured");
  }

  const signatureRes = await fetch(
    `${NEXT_PUBLIC_API_URL}/cloudinary/signature?folder=${encodeURIComponent(folder)}`,
  );
  if (!signatureRes.ok) {
    throw new Error("Failed to get upload signature");
  }

  const signatureData = (await signatureRes.json()) as SignatureResponse;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", String(signatureData.apiKey));
  formData.append("timestamp", String(signatureData.timestamp));
  formData.append("signature", String(signatureData.signature));
  formData.append("folder", String(signatureData.folder));

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!uploadRes.ok) {
    throw new Error("Image upload failed");
  }

  const uploadData = await uploadRes.json();
  return {
    url: String(uploadData.secure_url || ""),
    publicId: String(uploadData.public_id || ""),
  };
};
