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
      console.log("Auth callback started");
      
      try {
        // Handle OAuth callback with URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        // console.log("Current URL:", window.location.href);
        // console.log("Access token found:", !!accessToken);
        
        if (accessToken) {
          // Set the session from the URL parameters
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || ''
          });
          
          console.log("Session set result:", data);
          console.log("Session set error:", error);
          
          if (error) {
            console.error("Session set error:", error);
            setError("Failed to authenticate: " + error.message);
            setTimeout(() => router.push("/login"), 3000);
            return;
          }
        }
        
        // Get current session
        const { data, error } = await supabase.auth.getSession();
        
        console.log("Session data:", data);
        console.log("Session error:", error);
        
        if (error) {
          console.error("Auth error:", error);
          setError("Authentication failed: " + error.message);
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        if (data.session?.user) {
          console.log("User found, checking profile");
          
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
          setError("No user session found - please try logging in again");
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 max-w-md mx-4">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Authentication Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600 mb-4">Redirecting to login...</p>
          <button 
            onClick={() => router.push("/login")}
            className="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 max-w-md mx-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Setting up your account</h2>
        <p className="text-gray-600">Please wait while we process your login...</p>
        <div className="mt-4 text-sm text-gray-500">
          This may take a few seconds
        </div>
      </div>
    </div>
  );
}
