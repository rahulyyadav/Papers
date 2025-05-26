"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Head from "next/head";

export default function AddUniversityPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  // Step 1: Personal Info
  const [personal, setPersonal] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    universityName: "",
    email: "",
    password: "",
    password2: "",
  });
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalError, setPersonalError] = useState("");
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  // Step 2: University Info
  const [uni, setUni] = useState({
    name: "",
    country: "",
    number_of_exams: 1,
    exam_names: [""],
    official_website: "",
  });
  const [uniLoading, setUniLoading] = useState(false);
  const [uniError, setUniError] = useState("");
  const [uniSuccess, setUniSuccess] = useState(false);

  // Handlers for personal info
  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonal({ ...personal, [e.target.name]: e.target.value });
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalError("");
    if (
      !personal.firstName ||
      !personal.lastName ||
      !personal.universityName ||
      !personal.email ||
      !personal.password ||
      !personal.password2
    ) {
      setPersonalError("Please fill all required fields.");
      return;
    }
    if (personal.password !== personal.password2) {
      setPersonalError("Passwords do not match.");
      return;
    }
    setPersonalLoading(true);
    // Create user in Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: personal.email,
      password: personal.password,
    });
    if (signUpError) {
      setPersonalLoading(false);
      setPersonalError(signUpError.message);
      return;
    }
    const user_id = data.user?.id;
    if (!user_id) {
      setPersonalLoading(false);
      setPersonalError("Could not create user. Try again.");
      return;
    }
    // Insert into user_profiles (no email column)
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert([
        {
          user_id,
          first_name: personal.firstName,
          middle_name: personal.middleName,
          last_name: personal.lastName,
          university_name: personal.universityName,
        },
      ]);
    setPersonalLoading(false);
    if (profileError) {
      setPersonalError(profileError.message);
      return;
    }
    setCreatedUserId(user_id);
    setStep(2);
  };

  // Handlers for university info
  const handleUniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUni({ ...uni, [e.target.name]: e.target.value });
  };
  const handleNumExams = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) value = 1;
    if (value > 4) value = 4;
    setUni((prev) => ({
      ...prev,
      number_of_exams: value,
      exam_names: Array(value)
        .fill("")
        .map((_, i) => prev.exam_names[i] || ""),
    }));
  };
  const handleExamName = (i: number, value: string) => {
    setUni((prev) => {
      const updated = [...prev.exam_names];
      updated[i] = value;
      return { ...prev, exam_names: updated };
    });
  };

  const handleUniSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUniError("");
    setUniSuccess(false);
    if (!uni.name || !uni.country || !uni.exam_names.every((n) => n.trim())) {
      setUniError("Please fill all required fields.");
      return;
    }
    setUniLoading(true);
    // Get current user for added_by
    const { data: sessionData } = await supabase.auth.getUser();
    const added_by_user_id = sessionData.user?.id || createdUserId;
    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from("universities").insert([
      {
        name: uni.name,
        country: uni.country,
        number_of_exams: uni.number_of_exams,
        exam_names: uni.exam_names,
        official_website: uni.official_website || null,
        added_by_user_id,
        created_at: now,
      },
    ]);
    setUniLoading(false);
    if (insertError) {
      setUniError(insertError.message);
    } else {
      setUniSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  return (
    <>
      <Head>
        <title>Become a Contributor - Add Your University</title>
        <meta
          name="description"
          content="Become a contributor by adding your university and uploading papers to earn revenue."
        />
      </Head>
      <div className="min-h-screen flex flex-col items-center bg-[#f7f9fb] px-2 py-10">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow p-8 flex flex-col gap-8">
          {/* Description */}
          <div>
            <div className="underline font-semibold text-base mb-2">
              Description ( Must Read )
            </div>
            <div className="text-gray-700 text-sm leading-relaxed">
              <p className="mb-2">
                We believe your contribution should be rewarded.
                <br />
                If your university or college isn&apos;t listed yet, you can add
                it to our platform and start earning 1% of all ad revenue
                generated from papers uploaded under your university.
              </p>
              <p className="mb-2">
                It&apos;s 100% free to join, and there&apos;s no catch.
              </p>
              <p className="mb-2">
                Every end of the month, we&apos;ll send you an email with your
                total earnings. From there, you&apos;ll be able to provide your
                payment details and withdraw to your preferred account — simple,
                safe, and transparent.
              </p>
              <p className="mb-2">
                We don&apos;t collect payment info upfront to protect your
                privacy and build mutual trust first.
                <br />
                You get full control over when and how to receive your earnings.
              </p>
            </div>
          </div>
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <form
              className="flex flex-col gap-4"
              onSubmit={handleCreateAccount}
              autoComplete="off"
            >
              <div className="underline font-semibold text-base mb-2">
                Personal Information
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  First Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={personal.firstName}
                  onChange={handlePersonalChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={personal.middleName}
                  onChange={handlePersonalChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                  placeholder="Middle Name (Optional)"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Last Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={personal.lastName}
                  onChange={handlePersonalChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                  placeholder="Last Name"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  University Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="universityName"
                  value={personal.universityName}
                  onChange={handlePersonalChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                  placeholder="University Name"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={personal.email}
                  onChange={handlePersonalChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                  placeholder="Email"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  New Password<span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={personal.password}
                  onChange={handlePersonalChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                  placeholder="New Password"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Re-type New Password<span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password2"
                  value={personal.password2}
                  onChange={handlePersonalChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                  placeholder="Re-type New Password"
                />
              </div>
              {personalError && (
                <div className="text-red-500 text-sm mt-1">{personalError}</div>
              )}
              <button
                type="submit"
                className="mt-2 bg-black text-white font-semibold rounded-xl py-3 transition disabled:opacity-60"
                disabled={personalLoading}
              >
                {personalLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}
          {/* Step 2: University Information */}
          {step === 2 && (
            <form
              className="flex flex-col gap-4"
              onSubmit={handleUniSubmit}
              autoComplete="off"
            >
              <div className="underline font-semibold text-base mb-2">
                University Information
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  University/College Name
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={uni.name}
                  onChange={handleUniChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                  placeholder="e.g. VIT Vellore"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Country<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="country"
                  value={uni.country}
                  onChange={handleUniChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                  placeholder="e.g. India"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Number of exams
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="number_of_exams"
                  min={1}
                  max={4}
                  value={uni.number_of_exams}
                  onChange={handleNumExams}
                  required
                  aria-label="Number of Exams"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Exam Names
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-2">
                  {Array.from({ length: uni.number_of_exams }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      value={uni.exam_names[i] || ""}
                      onChange={(e) => handleExamName(i, e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                      placeholder={`Exam ${i + 1} Name`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Official Website (optional)
                </label>
                <input
                  type="url"
                  name="official_website"
                  value={uni.official_website}
                  onChange={handleUniChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                  placeholder="https://www.example.edu"
                />
              </div>
              {uniError && (
                <div className="text-red-500 text-sm mt-1">{uniError}</div>
              )}
              {uniSuccess && (
                <div className="flex flex-col items-center gap-2 text-green-700 text-base mt-1 animate-fade-in">
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
                    University added successfully!
                    <br />
                    Start uploading papers and earn with every view.
                  </span>
                </div>
              )}
              <button
                type="submit"
                className="mt-2 bg-black text-white font-semibold rounded-xl py-3 transition disabled:opacity-60"
                disabled={uniLoading || uniSuccess}
              >
                {uniLoading ? "Submitting..." : "Submit"}
              </button>
            </form>
          )}
        </div>
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
        `}</style>
      </div>
    </>
  );
}
