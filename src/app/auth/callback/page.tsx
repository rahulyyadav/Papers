"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback from URL hash
        const { data, error } = await supabase.auth.getSession();
        
        console.log("Auth callback - session data:", data);
        console.log("Auth callback - error:", error);
        
        if (error) {
          console.error("Auth error:", error);
          setError("Authentication failed: " + error.message);
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        if (data.session?.user) {
          console.log("User found:", data.session.user);
          
          // Check if user profile already exists
          const { data: profile, error: profileError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", data.session.user.id)
            .single();

          console.log("Profile check result:", profile);
          console.log("Profile check error:", profileError);

          if (profileError && profileError.code !== "PGRST116") {
            console.error("Profile check error:", profileError);
            setError("Database error: " + profileError.message);
            setTimeout(() => router.push("/login"), 3000);
            return;
          }

          if (profile) {
            console.log("Existing user, redirecting to home");
            router.push("/home");
          } else {
            console.log("New user, redirecting to university setup");
            router.push("/auth/university-setup");
          }
        } else {
          console.log("No user session found");
          setError("No user session found");
          setTimeout(() => router.push("/login"), 3000);
        }
      } catch (err) {
        console.error("Callback error:", err);
        setError("Something went wrong: " + (err as Error).message);
        setTimeout(() => router.push("/login"), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-red-600 mb-2">{error}</p>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return null;
}
