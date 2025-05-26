"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Head from "next/head";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    university: "",
    password: "",
    password2: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uniSearch, setUniSearch] = useState("");
  const [uniResults, setUniResults] = useState<string[]>([]);
  const [uniDropdownOpen, setUniDropdownOpen] = useState(false);
  const uniInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUniInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUniSearch(value);
    setForm({ ...form, university: value });
    if (value.length === 0) {
      setUniResults([]);
      setUniDropdownOpen(false);
      return;
    }
    const { data, error } = await supabase
      .from("universities")
      .select("name")
      .ilike("name", `${value}%`)
      .order("name", { ascending: true });
    if (!error && data) {
      setUniResults(data.map((u: { name: string }) => u.name));
      setUniDropdownOpen(true);
    } else {
      setUniResults([]);
      setUniDropdownOpen(false);
    }
  };

  const handleUniSelect = (name: string) => {
    setForm({ ...form, university: name });
    setUniSearch(name);
    setUniDropdownOpen(false);
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.university) {
      setError("Please fill all required fields.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.password || !form.password2) {
      setError("Please enter and confirm your password.");
      return;
    }
    if (form.password !== form.password2) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    // Supabase signup
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }
    // Insert into user_profiles
    const user_id = data.user?.id;
    if (user_id) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert([
          {
            user_id,
            first_name: form.firstName,
            middle_name: form.middleName,
            last_name: form.lastName,
            university_name: form.university,
          },
        ]);
      if (profileError) {
        setLoading(false);
        setError(profileError.message);
        return;
      }
    }
    setLoading(false);
    setStep(3);
    setTimeout(() => router.push("/home"), 1500);
  };

  return (
    <>
      <Head>
        <meta
          name="description"
          content="Log in to your Papers Platform account to share past exam question papers, earn revenue, and access resources."
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2349705329371450"
          crossOrigin="anonymous"
        ></script>
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-md bg-gray-50 rounded-2xl shadow-xl p-8 flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-6">Sign Up</h1>
          {step === 1 && (
            <form
              className="w-full flex flex-col gap-4"
              onSubmit={handleContinue}
              autoComplete="off"
            >
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                className="rounded-lg px-4 py-3 bg-white border border-gray-200 focus:border-black outline-none text-base"
                value={form.firstName}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <input
                type="text"
                name="middleName"
                placeholder="Middle Name (Optional)"
                className="rounded-lg px-4 py-3 bg-white border border-gray-200 focus:border-black outline-none text-base"
                value={form.middleName}
                onChange={handleChange}
                disabled={loading}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                className="rounded-lg px-4 py-3 bg-white border border-gray-200 focus:border-black outline-none text-base"
                value={form.lastName}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="rounded-lg px-4 py-3 bg-white border border-gray-200 focus:border-black outline-none text-base"
                value={form.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
              {/* University Autocomplete */}
              <div className="relative">
                <input
                  type="text"
                  name="university"
                  placeholder="University Name"
                  className="rounded-lg px-4 py-3 bg-white border border-gray-200 focus:border-black outline-none text-base"
                  value={uniSearch}
                  onChange={handleUniInput}
                  autoComplete="off"
                  ref={uniInputRef}
                  required
                  disabled={loading}
                  aria-label="University Name"
                  onFocus={() => {
                    if (uniResults.length > 0) setUniDropdownOpen(true);
                  }}
                />
                {uniDropdownOpen && uniResults.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow max-h-48 overflow-auto">
                    {uniResults.map((name) => (
                      <button
                        type="button"
                        key={name}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleUniSelect(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                type="submit"
                className="bg-black text-white rounded-lg py-3 font-semibold text-base hover:bg-gray-900 transition disabled:opacity-60"
                disabled={loading}
              >
                Continue
              </button>
            </form>
          )}
          {step === 2 && (
            <form
              className="w-full flex flex-col gap-4"
              onSubmit={handleSignup}
            >
              <input
                type="password"
                name="password"
                placeholder="New Password"
                className="rounded-lg px-4 py-3 bg-white border border-gray-200 focus:border-black outline-none text-base"
                value={form.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <input
                type="password"
                name="password2"
                placeholder="Re-type New Password"
                className="rounded-lg px-4 py-3 bg-white border border-gray-200 focus:border-black outline-none text-base"
                value={form.password2}
                onChange={handleChange}
                required
                disabled={loading}
              />
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                type="submit"
                className="bg-black text-white rounded-lg py-3 font-semibold text-base hover:bg-gray-900 transition disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Signing up..." : "Sign Up"}
              </button>
            </form>
          )}
          {step === 3 && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="text-green-600 font-semibold text-lg">
                Account created!
              </div>
              <div className="text-gray-500 text-sm">
                Redirecting to home...
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="mt-6 text-sm text-gray-600 flex flex-col items-start gap-1">
              <span>
                Already have an account?{" "}
                <a href="/login" className="underline hover:text-black">
                  Login
                </a>
              </span>
              <a
                href="/add-university"
                className="underline text-blue-600 hover:text-blue-800 cursor-pointer mt-1"
              >
                University missing? Add & earn
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
