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
  const [hasAdditionalRules, setHasAdditionalRules] = useState(false);
  const [additionalRules, setAdditionalRules] = useState("");
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
    
    // Process additional rules - convert comma-separated string to array
    const additionalRulesArray = hasAdditionalRules && additionalRules.trim() 
      ? additionalRules.split(',').map(rule => rule.trim()).filter(rule => rule.length > 0)
      : null;
    
    const { error: insertError } = await supabase.from("universities").insert([
      {
        name: uni.name,
        country: uni.country,
        number_of_exams: uni.number_of_exams,
        exam_names: uni.exam_names,
        official_website: uni.official_website || null,
        additional: additionalRulesArray,
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
        <meta name="google-adsense-account" content="ca-pub-2349705329371450" />
        <meta
          name="description"
          content="Become a contributor by adding your university and uploading past exam papers to earn revenue."
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2349705329371450"
          crossOrigin="anonymous"
        ></script>
      </Head>
      <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
        <div className="w-full max-w-lg bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 flex flex-col gap-8">
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
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Personal Information</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white/80 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 hover:border-gray-300"
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white/80 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 hover:border-gray-300"
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white/80 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 hover:border-gray-300"
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white/80 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 hover:border-gray-300"
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white/80 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 hover:border-gray-300"
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white/80 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 hover:border-gray-300"
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white/80 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 hover:border-gray-300"
                  placeholder="Re-type New Password"
                />
              </div>
              {personalError && (
                <div className="text-red-500 text-sm mt-1">{personalError}</div>
              )}
              <button
                type="submit"
                className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl py-3 px-6 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">University Information</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white/80 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 hover:border-gray-300"
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white/80 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 hover:border-gray-300"
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white/80 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 hover:border-gray-300"
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
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white/80 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 hover:border-gray-300"
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
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-blue-500 outline-none transition-colors duration-200 hover:border-gray-300"
                  placeholder="https://www.example.edu"
                />
              </div>
              
              {/* Additional Exam Rules Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <label className="block mb-3 font-medium text-gray-800">
                  Does your university follow any additional exam rules?
                  <span className="block text-sm text-gray-600 font-normal mt-1">
                    Like exam slots (A1, A2, B1, B2) or other specific patterns?
                  </span>
                </label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="hasAdditionalRules"
                      checked={hasAdditionalRules === true}
                      onChange={() => setHasAdditionalRules(true)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="hasAdditionalRules"
                      checked={hasAdditionalRules === false}
                      onChange={() => {
                        setHasAdditionalRules(false);
                        setAdditionalRules("");
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">No</span>
                  </label>
                </div>
                
                {hasAdditionalRules && (
                  <div className="animate-fade-in">
                    <input
                      type="text"
                      value={additionalRules}
                      onChange={(e) => setAdditionalRules(e.target.value)}
                      className="w-full rounded-lg border border-blue-200 px-4 py-3 bg-white text-base focus:border-blue-500 outline-none transition-colors duration-200"
                      placeholder="Write them here, e.g., A1, A2, B1, B2 (comma separated)"
                    />
                  </div>
                )}
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
                className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl py-3 px-6 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
