"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { PDFDocument } from "pdf-lib";
import Head from "next/head";

export default function UploadPage() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [university, setUniversity] = useState("");
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [examNames, setExamNames] = useState<string[]>([]);
  const [exam, setExam] = useState("");
  const [customExam, setCustomExam] = useState("");
  const [examYear, setExamYear] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploadStep, setUploadStep] = useState<
    | "idle"
    | "checking_info"
    | "checking_quality"
    | "compressing"
    | "uploading"
    | "success"
    | "error"
  >("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch universities on mount
  useEffect(() => {
    async function fetchUniversities() {
      const { data, error } = await supabase
        .from("universities")
        .select("id, name, exam_names");
      if (!error && data) setUniversities(data);
    }
    fetchUniversities();
  }, []);

  // Fetch exam names when university changes
  useEffect(() => {
    if (!university) {
      setExamNames([]);
      setExam("");
      setUniversityId(null);
      return;
    }
    const uni = universities.find((u) => u.name === university);
    if (uni) {
      setExamNames(uni.exam_names || []);
      setUniversityId(uni.id);
      setExam("");
      setCustomExam("");
    }
  }, [university, universities]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const isFormValid =
    university &&
    ((exam && exam !== "Other") || (exam === "Other" && customExam.trim())) &&
    examYear &&
    courseCode &&
    courseName &&
    file &&
    file.type === "application/pdf";

  async function compressPdfToUnderHalfMB(inputPdf: File): Promise<Blob> {
    const buffer = await inputPdf.arrayBuffer();

    // Load the PDF
    const pdfDoc = await PDFDocument.load(buffer);

    // Remove metadata
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    // Get all pages
    const pages = pdfDoc.getPages();

    // First pass: Aggressive page scaling
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      // More aggressive scaling - target 800px max dimension
      const scale = Math.min(800 / width, 800 / height);
      page.scale(scale, scale);
      const newSize = page.getSize();
    }

    // First compression pass
    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 10,
      updateFieldAppearances: false,
    });

    // If still too large, try second pass with even more aggressive compression
    if (compressedPdfBytes.byteLength > 500 * 1024) {
      const pdfDoc2 = await PDFDocument.load(compressedPdfBytes);
      const pages = pdfDoc2.getPages();

      // Second pass: Even more aggressive scaling
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        // Target 600px max dimension
        const scale = Math.min(600 / width, 600 / height);
        page.scale(scale, scale);
        const newSize = page.getSize();
      }

      // Final save with maximum compression
      const finalBytes = await pdfDoc2.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 5,
        updateFieldAppearances: false,
      });

      // If still too large, try one final pass
      if (finalBytes.byteLength > 500 * 1024) {
        const pdfDoc3 = await PDFDocument.load(finalBytes);
        const pages = pdfDoc3.getPages();

        // Final pass: Maximum scaling
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const { width, height } = page.getSize();
          // Target 400px max dimension
          const scale = Math.min(400 / width, 400 / height);
          page.scale(scale, scale);
        }

        const ultraCompressedBytes = await pdfDoc3.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 1,
          updateFieldAppearances: false,
        });


        return new Blob([ultraCompressedBytes], { type: "application/pdf" });
      }

      return new Blob([finalBytes], { type: "application/pdf" });
    }

    return new Blob([compressedPdfBytes], { type: "application/pdf" });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setUploadStep("idle"); // Reset steps

    if (!isFormValid) {
      setError("Please fill in all required fields and select a PDF file.");
      return;
    }

    setLoading(true);
    setUploadStep("checking_info");

    try {
      // 1. Check Paper Information (Form Validation - Already done by isFormValid)
      // If we reach here, form is valid.

      // Simulate a brief delay for demonstration
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUploadStep("checking_quality");

      // 2. Checking PDF Quality (Placeholder)
      // Future implementation goes here
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUploadStep("compressing");

      // 3. Compressing PDF Size
      if (!file) throw new Error("No file selected");
      const compressedPdf = await compressPdfToUnderHalfMB(file);
      const compressedFile = new File([compressedPdf], file.name, {
        type: "application/pdf",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
      setUploadStep("uploading");

      // 4. Upload PDF to Supabase Storage
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      if (!user_id) throw new Error("User not logged in");
      if (!universityId) throw new Error("University not found");

      const fileExt = compressedFile.name.split(".").pop();
      const fileName = `pdfs/${uuidv4()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("question-papers")
        .upload(fileName, compressedFile);
      if (uploadError) throw new Error(uploadError.message);

      // 5. Get public URL
      const { data: urlData } = supabase.storage
        .from("question-papers")
        .getPublicUrl(fileName);
      const pdf_url = urlData?.publicUrl;
      if (!pdf_url) throw new Error("Could not get PDF URL");

      // 6. Insert into question-papers table
      const { error: insertError } = await supabase
        .from("question-papers")
        .insert([
          {
            user_id,
            university_id: universityId,
            course_code: courseCode,
            course_name: courseName,
            exam_name: exam === "Other" ? customExam : exam,
            exam_year: parseInt(examYear, 10),
            pdf_url,
            uploaded_at: new Date().toISOString(),
          },
        ]);
      if (insertError) throw new Error(insertError.message);

      setUploadStep("success");
      setSuccess(true);
      // Clear form fields after successful upload
      setUniversity("");
      setExam("");
      setCustomExam("");
      setExamYear("");
      setCourseCode("");
      setCourseName("");
      setFile(null);
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setUploadStep("error");
    } finally {
      setLoading(false);
    }
  };

  const stepNames = {
    checking_info: "Checking Paper Information",
    checking_quality: "Checking PDF quality",
    compressing: "Compressing PDF Size",
    uploading: "Uploading PDF",
  };

  type UploadStepKey = keyof typeof stepNames;

  const getStepStatus = (step: UploadStepKey) => {
    const stepOrder: UploadStepKey[] = [
      "checking_info",
      "checking_quality",
      "compressing",
      "uploading",
    ];
    const currentIndex = stepOrder.indexOf(uploadStep as UploadStepKey);
    const stepIndex = stepOrder.indexOf(step);

    if (uploadStep === "success") return "completed";
    if (uploadStep === "error") return "failed";
    if (currentIndex > stepIndex) return "completed";
    if (currentIndex === stepIndex) return "current";
    return "pending";
  };

  return (
    <>
      <Head>
        <title>Upload Papers - Contribute and Earn</title>
        <meta name="google-adsense-account" content="ca-pub-2349705329371450" />
        <meta
          name="description"
          content="Upload your university question papers to Papers Platform and start earning revenue."
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2349705329371450"
          crossOrigin="anonymous"
        ></script>
      </Head>
      <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center py-8 px-2">
        <h1 className="text-3xl font-bold text-center mb-8">
          Upload Past Papers
        </h1>
        <div className="w-full max-w-2xl mx-auto">
          {/* Hero Section (Updated) */}
          <div
            className="bg-white rounded-2xl shadow mb-8 p-8 flex flex-col gap-2 items-start justify-center relative"
            style={{
              minHeight: 180,
            }}
          >
            {/* Removed Background Image and Overlay */}
            <div className="max-w-md">
              <div className="text-xl font-bold mb-1">
                Upload your past papers and earn money
              </div>
              <div className="text-base text-gray-700">
                Upload your past papers to help other students and earn money
                for your contributions.
              </div>
            </div>
          </div>
          {/* Form (Improved UI) */}
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="university"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                University<span className="text-red-500">*</span>
              </label>
              <select
                id="university"
                aria-label="Select University"
                className="rounded-lg border border-gray-300 px-4 py-3 bg-white text-base focus:border-black focus:ring-1 focus:ring-black outline-none w-full"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select University</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.name}>
                    {uni.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="exam"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Exam<span className="text-red-500">*</span>
              </label>
              <select
                id="exam"
                aria-label="Select Exam"
                className="rounded-lg border border-gray-300 px-4 py-3 bg-white text-base focus:border-black focus:ring-1 focus:ring-black outline-none w-full"
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select Exam</option>
                {examNames.map((exam) => (
                  <option key={exam} value={exam}>
                    {exam}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>

            {exam === "Other" && (
              <div>
                <label
                  htmlFor="custom-exam"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Custom Exam Name<span className="text-red-500">*</span>
                </label>
                <input
                  id="custom-exam"
                  type="text"
                  placeholder="Enter exam name"
                  className="rounded-lg border border-gray-300 px-4 py-3 bg-white text-base focus:border-black focus:ring-1 focus:ring-black outline-none w-full"
                  value={customExam}
                  onChange={(e) => setCustomExam(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <label
                htmlFor="exam-year"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Exam Year<span className="text-red-500">*</span>
              </label>
              <input
                id="exam-year"
                type="text"
                placeholder="e.g. 2023"
                className="rounded-lg border border-gray-300 px-4 py-3 bg-white text-base focus:border-black focus:ring-1 focus:ring-black outline-none w-full"
                value={examYear}
                onChange={(e) => setExamYear(e.target.value)}
                required
                disabled={loading}
                aria-label="Exam Year"
              />
            </div>

            <div>
              <label
                htmlFor="course-code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Course Code<span className="text-red-500">*</span>
              </label>
              <input
                id="course-code"
                type="text"
                placeholder="e.g. CS101"
                className="rounded-lg border border-gray-300 px-4 py-3 bg-white text-base focus:border-black focus:ring-1 focus:ring-black outline-none w-full"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                required
                disabled={loading}
                aria-label="Course Code"
              />
            </div>

            <div>
              <label
                htmlFor="course-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Course Name<span className="text-red-500">*</span>
              </label>
              <input
                id="course-name"
                type="text"
                placeholder="e.g. Introduction to Computer Science"
                className="rounded-lg border border-gray-300 px-4 py-3 bg-white text-base focus:border-black focus:ring-1 focus:ring-black outline-none w-full"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                required
                disabled={loading}
                aria-label="Course Name"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload PDF<span className="text-red-500">*</span>
              </label>
              <div
                className={`rounded-xl border-2 border-dashed ${
                  dragActive
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 bg-white"
                } flex flex-col items-center justify-center py-10 px-4 text-center transition-colors cursor-pointer w-full`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  required
                  disabled={loading}
                  className="hidden"
                  aria-label={
                    file
                      ? `Selected file: ${file.name}`
                      : "Drag and drop your PDF here, or click to select"
                  }
                />
                {file ? (
                  <div className="text-gray-700 font-medium">
                    Selected file: {file.name}
                  </div>
                ) : (
                  <div className="text-gray-500">
                    Drag and drop your PDF here, or click to select
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2 text-center">
                {error}
              </div>
            )}

            {/* Upload Progress Indicator */}
            {uploadStep !== "idle" && uploadStep !== "success" && (
              <div className="mt-6 w-full">
                <h3 className="font-semibold text-lg text-center mb-4">
                  Uploading...
                </h3>
                <div className="flex items-start justify-between w-full relative">
                  {/* Connecting Line */}
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-300 z-0" />
                  <div
                    className={`absolute top-4 left-0 h-0.5 bg-green-500 z-10 transition-all duration-500 ease-in-out`}
                    style={{
                      width: `${
                        uploadStep === "checking_info"
                          ? 0 // Line starts after first step completes visually
                          : uploadStep === "checking_quality"
                          ? 33
                          : uploadStep === "compressing"
                          ? 66
                          : uploadStep === "uploading"
                          ? 99
                          : 0 // Extend almost fully for uploading
                      }%`,
                    }}
                  />

                  {Object.entries(stepNames).map(([key, name]) => (
                    <div
                      key={key}
                      className="flex flex-col items-center z-20 w-1/4"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold transition-colors duration-500
                          ${
                            getStepStatus(key as UploadStepKey) === "completed"
                              ? "bg-green-500"
                              : getStepStatus(key as UploadStepKey) ===
                                "current"
                              ? "bg-blue-500 animate-pulse"
                              : getStepStatus(key as UploadStepKey) === "failed"
                              ? "bg-red-500"
                              : "bg-gray-300"
                          }
                        `}
                      >
                        {getStepStatus(key as UploadStepKey) ===
                          "completed" && (
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                        {getStepStatus(key as UploadStepKey) === "current" && (
                          <svg
                            className="w-5 h-5 text-white animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l2-2.647z"
                            ></path>
                          </svg>
                        )}
                        {getStepStatus(key as UploadStepKey) === "failed" && (
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            ></path>
                          </svg>
                        )}
                      </div>
                      <div
                        className={`text-xs mt-1 text-center ${
                          getStepStatus(key as UploadStepKey) === "current"
                            ? "font-semibold text-blue-600"
                            : getStepStatus(key as UploadStepKey) === "failed"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {success && (
              <div className="flex flex-col items-center gap-2 text-green-700 text-base mt-4 animate-fade-in">
                <svg
                  className="w-10 h-10 text-green-500 animate-bounce"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="#d1fae5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12l2.5 2.5L16 9"
                  />
                </svg>
                <span className="font-semibold text-center">
                  Paper uploaded successfully!
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="mt-6 bg-black text-white font-semibold rounded-xl py-3 transition disabled:opacity-60 w-full"
              disabled={loading || success || !isFormValid}
            >
              {loading
                ? uploadStep === "checking_info"
                  ? "Checking Info..."
                  : uploadStep === "checking_quality"
                  ? "Checking Quality..."
                  : uploadStep === "compressing"
                  ? "Compressing..."
                  : uploadStep === "uploading"
                  ? "Uploading..."
                  : "Processing..."
                : "Upload Paper"}
            </button>
          </form>
        </div>
        {/* Animation Style */}
        <style jsx global>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: none;
            }
          }
          .animate-fade-in {
            animation: fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
          }
          @keyframes pulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes bounce {
            0%,
            20%,
            53%,
            80%,
            100% {
              transform: translateZ(0);
            }
            40%,
            43% {
              transform: translateY(-10px);
            }
            78% {
              transform: translateY(-5px);
            }
          }
          .animate-bounce {
            animation: bounce 1s infinite;
          }
        `}</style>
      </div>
    </>
  );
}
