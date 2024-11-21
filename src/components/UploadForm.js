"use client";
import axios from "axios";
import UploadIcon from "./UploadIcon";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // State for progress

  const router = useRouter();

  async function upload(ev) {
    ev.preventDefault();
    const files = ev.target.files;
    if (files.length > 0) {
      const file = files[0];
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post("/api/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total;
            const current = progressEvent.loaded;
            const percent = Math.round((current / total) * 100);
            setUploadProgress(percent); // Update progress state
          },
        });
        setIsUploading(false);
        setUploadProgress(0); // Reset progress
        const newName = response.data.newName;
        router.push("/" + newName);
      } catch (error) {
        setIsUploading(false);
        setUploadProgress(0); // Reset progress on error
        console.error("Upload failed:", error);
      }
    }
  }

  return (
    <>
      {isUploading && (
        <div className="bg-black/90 text-white fixed inset-0 flex items-center">
          <div className="w-full text-center">
            <h2 className="text-4xl mb-4">Uploading...</h2>
            <div className="w-2/3 mx-auto bg-gray-700 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <h3 className="text-xl mt-2">{uploadProgress}%</h3>
          </div>
        </div>
      )}
      <label className="bg-green-600 py-2 px-6 rounded-full inline-flex gap-2 border-2 border-purple-700/50 cursor-pointer">
        <UploadIcon />
        <span>Choose File</span>
        <input onChange={upload} type="file" className="hidden" />
      </label>
    </>
  );
}
