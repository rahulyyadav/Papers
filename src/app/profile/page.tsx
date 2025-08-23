"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Head from "next/head";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [tab, setTab] = useState<"personal" | "contributor">("personal");
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [papersUploaded, setPapersUploaded] = useState(0);
  const [contributorSince, setContributorSince] = useState("");
  const [showUniForm, setShowUniForm] = useState(false);
  const [uni, setUni] = useState<any>({
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
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");

      // Fetch user profile
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select(
          "first_name, middle_name, last_name, university_name, created_at"
        )
        .eq("user_id", user.id)
        .single();
      if (profileData) {
        setProfile(profileData);
        // Set contributor since year from created_at
        setContributorSince(
          new Date(profileData.created_at).getFullYear().toString()
        );
      }

      // Fetch papers uploaded count
      const { count } = await supabase
        .from("question-papers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setPapersUploaded(count || 0);
    }
    fetchProfile();
  }, []);

  const fullName = profile
    ? [profile.first_name, profile.middle_name, profile.last_name]
        .filter(Boolean)
        .join(" ")
    : "";

  const handleUniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUni({ ...uni, [e.target.name]: e.target.value });
  };
  const handleNumExams = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) value = 1;
    if (value > 4) value = 4;
    setUni((prev: any) => ({
      ...prev,
      number_of_exams: value,
      exam_names: Array(value)
        .fill("")
        .map((_, i) => prev.exam_names[i] || ""),
    }));
  };
  const handleExamName = (i: number, value: string) => {
    setUni((prev: any) => {
      const updated = [...prev.exam_names];
      updated[i] = value;
      return { ...prev, exam_names: updated };
    });
  };
  const handleUniSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUniError("");
    setUniSuccess(false);
    if (
      !uni.name ||
      !uni.country ||
      !uni.exam_names.every((n: any) => n.trim())
    ) {
      setUniError("Please fill all required fields.");
      return;
    }
    setUniLoading(true);
    const { data: sessionData } = await supabase.auth.getUser();
    const added_by_user_id = sessionData.user?.id;
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
      setUni({
        name: "",
        country: "",
        number_of_exams: 1,
        exam_names: [""],
        official_website: "",
      });
      setHasAdditionalRules(false);
      setAdditionalRules("");
      setTimeout(() => setShowUniForm(false), 2000);
    }
  };

  return (
    <>
      <Head>
        <title>My Profile - Papers Platform</title>
        <meta name="google-adsense-account" content="ca-pub-2349705329371450" />
        <meta
          name="description"
          content="View and update your personal and contributor information on Papers Platform."
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2349705329371450"
          crossOrigin="anonymous"
        ></script>
      </Head>
      <div className="min-h-screen bg-[#f7f9fb] px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Profile</h1>
          {/* Tabs */}
          <div className="flex gap-8 border-b border-gray-200 mb-8">
            <button
              className={`pb-2 font-medium text-base border-b-2 transition-all ${
                tab === "personal"
                  ? "border-gray-800 text-black"
                  : "border-transparent text-gray-500"
              }`}
              onClick={() => setTab("personal")}
            >
              Personal Information
            </button>
            <button
              className={`pb-2 font-medium text-base border-b-2 transition-all ${
                tab === "contributor"
                  ? "border-gray-800 text-black"
                  : "border-transparent text-gray-500"
              }`}
              onClick={() => setTab("contributor")}
            >
              Contributor Page
            </button>
          </div>
          {/* Tab Content */}
          {tab === "personal" && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">
                Personal Information
              </h2>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Name</label>
                <input
                  type="text"
                  value={fullName}
                  readOnly
                  aria-label="Full Name"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Email</label>
                <input
                  type="text"
                  value={email}
                  readOnly
                  aria-label="Email"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  University Name
                </label>
                <input
                  type="text"
                  value={profile?.university_name || ""}
                  readOnly
                  aria-label="University Name"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                />
              </div>
            </div>
          )}
          {tab === "contributor" && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">Contributor Page</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center">
                  <div className="text-3xl font-bold mb-1">
                    {papersUploaded}
                  </div>
                  <div className="text-gray-500 text-base">Papers Uploaded</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center">
                  <div className="text-3xl font-bold mb-1">
                    {contributorSince}
                  </div>
                  <div className="text-gray-500 text-base">
                    Contributor Since
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <button
                  className="bg-black text-white font-semibold rounded-xl py-3 px-6 transition hover:bg-gray-900 mb-6"
                  onClick={() => {
                    if (!email) {
                      router.push("/login");
                    } else {
                      setShowUniForm(true);
                    }
                  }}
                >
                  Add new university/College
                </button>
                {showUniForm && (
                  <>
                    {/* Modal Overlay */}
                    <div
                      className="fixed inset-0 bg-black/40 z-40"
                      onClick={() => setShowUniForm(false)}
                    />
                    {/* Modal Content */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-200 p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button
                          className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-black"
                          onClick={() => setShowUniForm(false)}
                          aria-label="Close"
                        >
                          &times;
                        </button>
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
                              {Array.from({ length: uni.number_of_exams }).map(
                                (_, i) => (
                                  <input
                                    key={i}
                                    type="text"
                                    value={uni.exam_names[i] || ""}
                                    onChange={(e) =>
                                      handleExamName(i, e.target.value)
                                    }
                                    required
                                    className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white text-base focus:border-black outline-none"
                                    placeholder={`Exam ${i + 1} Name`}
                                  />
                                )
                              )}
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
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                            <label className="block mb-3 font-medium text-gray-800">
                              Does your university follow any additional exam rules?
                              <span className="block text-sm text-gray-600 font-normal mt-1">
                                Like exam slots (A1, A2, B1, B2) or other specific patterns?
                              </span>
                            </label>
                            <div className="flex gap-4 mb-3">
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
                            <div className="text-red-500 text-sm mt-1">
                              {uniError}
                            </div>
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
                            className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl py-3 px-6 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full"
                            disabled={uniLoading || uniSuccess}
                          >
                            {uniLoading ? "Submitting..." : "Submit"}
                          </button>
                        </form>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
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
    </>
  );
}
