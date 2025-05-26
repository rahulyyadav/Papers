"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Head from "next/head";

interface Paper {
  id: string;
  course_code: string;
  course_name: string;
  exam_name: string;
  exam_year: number;
  pdf_url: string;
  uploaded_at: string;
}

interface GroupedPapers {
  [courseName: string]: Paper[];
}

export default function SubjectsPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null); // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [universities, setUniversities] = useState<any[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [selectedUniversityId, setSelectedUniversityId] = useState<
    string | null
  >(null);
  const [groupedPapers, setGroupedPapers] = useState<GroupedPapers>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  // Fetch user profile and universities on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      // Fetch user profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let userUni = "";
      if (user) {
        const { data, error: profileError } = await supabase
          .from("user_profiles")
          .select("first_name, last_name, university_name")
          .eq("user_id", user.id)
          .single();
        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          setError("Failed to fetch user profile.");
        }
        if (data) {
          setUserProfile(data);
          userUni = data.university_name;
        }
      }
      // Fetch universities
      const { data: uniData, error: uniError } = await supabase
        .from("universities")
        .select("id, name");
      if (uniError) {
        console.error("Error fetching universities:", uniError);
        setError("Failed to fetch universities.");
      }

      if (uniData) {
        setUniversities(uniData);
        // Set default selected university to user's university
        const defaultUni = uniData.find((u: any) => u.name === userUni);
        const initialUni = defaultUni ? defaultUni : uniData[0];
        setSelectedUniversity(initialUni?.name || "");
        setSelectedUniversityId(initialUni?.id || null);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Update selectedUniversityId when selectedUniversity changes
  useEffect(() => {
    const uni = universities.find((u) => u.name === selectedUniversity);
    setSelectedUniversityId(uni ? uni.id : null);
  }, [selectedUniversity, universities]);

  // Fetch and group papers when selectedUniversityId changes
  useEffect(() => {
    async function fetchAndGroupPapers() {
      if (!selectedUniversityId) {
        setGroupedPapers({});
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error: papersError } = await supabase
        .from("question-papers")
        .select(
          "id, course_code, course_name, exam_name, exam_year, pdf_url, uploaded_at"
        )
        .eq("university_id", selectedUniversityId)
        .order("course_name", { ascending: true });

      if (papersError) {
        console.error("Error fetching papers:", papersError);
        setError("Failed to fetch papers.");
        setGroupedPapers({});
      } else if (data) {
        const grouped: GroupedPapers = data.reduce((acc, paper) => {
          const courseName = paper.course_name;
          if (!acc[courseName]) {
            acc[courseName] = [];
          }
          acc[courseName].push(paper);
          return acc;
        }, {} as GroupedPapers);
        setGroupedPapers(grouped);
      } else {
        setGroupedPapers({});
      }
      setLoading(false);
      setExpandedCourse(null); // Collapse all when university changes
    }
    fetchAndGroupPapers();
  }, [selectedUniversityId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const getInitials = () => {
    if (!userProfile) return "";
    const f = userProfile.first_name?.[0] || "";
    const l = userProfile.last_name?.[0] || "";
    return (f + l).toUpperCase();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleCourseClick = (courseName: string) => {
    setExpandedCourse(expandedCourse === courseName ? null : courseName);
  };

  return (
    <>
      <Head>
        <title>
          {selectedUniversity
            ? `${selectedUniversity} Subjects - Papers Platform`
            : "Subjects - Papers Platform"}
        </title>
        <meta
          name="description"
          content="Browse question papers by subject for your selected university. Earn the revenue by uploading your own past exam papers."
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2349705329371450"
          crossOrigin="anonymous"
        ></script>
      </Head>
      <div className="min-h-screen bg-[#f7f9fb]">
        {/* Navbar */}
        <nav className="w-full flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-8">
            <span className="font-bold text-2xl tracking-tight flex items-center gap-2">
              Papers
            </span>
            <div className="hidden md:flex gap-6 text-sm font-medium text-gray-700">
              <a href="/home" className="hover:text-black">
                Dashboard
              </a>
              <a
                href="/subjects"
                className="hover:text-black font-semibold text-black"
              >
                Subjects
              </a>
              <a href="/upload" className="hover:text-black">
                Upload Paper
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* University Dropdown */}
            <select
              aria-label="Select university"
              className="rounded-full bg-[#f2f4f7] px-4 py-2 text-sm border border-gray-200 focus:border-gray-400 outline-none min-w-[180px]"
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
            >
              {universities.map((uni) => (
                <option key={uni.id} value={uni.name}>
                  {uni.name}
                </option>
              ))}
            </select>
            {/* Profile Initials Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="w-9 h-9 rounded-full bg-[#d1e0e9] flex items-center justify-center font-bold text-lg text-[#2a3a4a] border border-gray-200 hover:shadow"
                title="Profile"
              >
                {getInitials() || "--"}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-t-lg"
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push("/profile");
                    }}
                  >
                    Profile Information
                  </button>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-b-lg text-red-600"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Subjects</h1>

          {loading && (
            <div className="text-center text-gray-500">Loading subjects...</div>
          )}
          {error && (
            <div className="text-center text-red-500">Error: {error}</div>
          )}
          {!loading && !error && Object.keys(groupedPapers).length === 0 && (
            <div className="text-center text-gray-500">
              No subjects found for this university.
            </div>
          )}

          {!loading && !error && Object.keys(groupedPapers).length > 0 && (
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              {Object.entries(groupedPapers)
                .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
                .map(([courseName, papers]) => (
                  <div
                    key={courseName}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <button
                      className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
                      onClick={() => handleCourseClick(courseName)}
                    >
                      <span className="font-semibold text-lg">
                        {courseName}
                      </span>
                      <span className="text-gray-500">
                        ({papers.length}{" "}
                        {papers.length === 1 ? "paper" : "papers"})
                      </span>
                    </button>
                    {expandedCourse === courseName && (
                      <div className="px-6 py-4 bg-[#f7f9fb]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {papers.map((paper) => (
                            <a
                              key={paper.id}
                              href={paper.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-gray-400 transition"
                            >
                              <svg
                                width="24"
                                height="24"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="1.5"
                                  d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"
                                />
                                <path
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="1.5"
                                  d="M17 21v-8a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v8m10-11V7.5a.5.5 0 0 0-.5-.5H14m-3 4h-4m4 4h-4m3-8h-2"
                                />
                              </svg>
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {paper.exam_name} ({paper.exam_year})
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {paper.course_code}
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
