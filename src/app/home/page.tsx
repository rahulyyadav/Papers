"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Head from "next/head";
import { Suspense } from "react";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userProfile, setUserProfile] = useState<any>(null); // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [universities, setUniversities] = useState<any[]>([]); // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [selectedUniversityId, setSelectedUniversityId] = useState<
    string | null
  >(null);
  const [papers, setPapers] = useState<any[]>([]); // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filteredPapers, setFilteredPapers] = useState<any[]>([]); // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const papersPerPage = 6;
  const [email, setEmail] = useState("");

  // Suggested prompts
  const suggestedPrompts = [
    "More model questions of VIT-Vellore CAT",
    "Model questions of IIT Delhi, DBMS",
    "Explain the grading system in my university",
    "What are the popular subjects in my university?",
  ];

  // Calculate papers to display for the current page
  const indexOfLastPaper = currentPage * papersPerPage;
  const indexOfFirstPaper = indexOfLastPaper - papersPerPage;
  const currentPapers = filteredPapers.slice(
    indexOfFirstPaper,
    indexOfLastPaper
  );

  // Calculate total pages
  const totalPages = Math.ceil(filteredPapers.length / papersPerPage);

  // Handle pagination button clicks
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset pagination to page 1 when filtered papers change (due to university selection or search)
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredPapers]);

  // Fetch user profile and universities on mount
  useEffect(() => {
    async function fetchData() {
      // Fetch user profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let userUni = "";
      if (user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("first_name, last_name, university_name")
          .eq("user_id", user.id)
          .single();
        if (data) {
          setUserProfile(data); // eslint-disable-next-line @typescript-eslint/no-explicit-any
          userUni = data.university_name;
          setEmail(user.user_metadata.email);
        }
      }
      // Fetch universities
      const { data: uniData } = await supabase
        .from("universities")
        .select("id, name");
      if (uniData) {
        setUniversities(uniData); // eslint-disable-next-line @typescript-eslint/no-explicit-any

        const universityIdFromUrl = searchParams.get("universityId");
        let initialUni = null;

        if (universityIdFromUrl) {
          initialUni = uniData.find((u: any) => u.id === universityIdFromUrl); // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }

        // If no university ID in URL or not found, try user's university, else default to first
        if (!initialUni) {
          initialUni = uniData.find((u: any) => u.name === userUni); // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }

        if (!initialUni && uniData.length > 0) {
          initialUni = uniData[0];
        }

        setSelectedUniversity(initialUni?.name || "");
        setSelectedUniversityId(initialUni?.id || null);
      }
    }
    fetchData();
  }, [searchParams, supabase, router]); // Add searchParams, supabase, router to dependency array

  // Update selectedUniversityId when selectedUniversity changes
  useEffect(() => {
    const uni = universities.find((u) => u.name === selectedUniversity);
    setSelectedUniversityId(uni ? uni.id : null);
  }, [selectedUniversity, universities]);

  // Fetch papers when selectedUniversityId changes
  useEffect(() => {
    async function fetchPapers() {
      if (!selectedUniversityId) {
        setPapers([]);
        setFilteredPapers([]);
        return;
      }
      const { data, error } = await supabase
        .from("question-papers")
        .select(
          "id, course_code, course_name, exam_name, exam_year, pdf_url, uploaded_at"
        )
        .eq("university_id", selectedUniversityId)
        .order("uploaded_at", { ascending: false });

      if (!error && data) {
        setPapers(data);
        setFilteredPapers(data);
      }
    }
    fetchPapers();
  }, [selectedUniversityId]);

  // Filter papers when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPapers(papers);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = papers.filter((paper) => {
      return (
        paper.course_code.toLowerCase().includes(searchLower) ||
        paper.course_name.toLowerCase().includes(searchLower) ||
        paper.exam_name.toLowerCase().includes(searchLower) ||
        paper.exam_year.toString().includes(searchLower)
      );
    });
    setFilteredPapers(filtered);
  }, [searchTerm, papers]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }
    if (dropdownOpen || mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen, mobileMenuOpen]);

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

  const handleSuggestedPromptClick = (prompt: string) => {
    setChatInput(prompt);
    setShowChatModal(true);
    // Optionally, immediately send the message upon clicking
    // handleAskAI(); // We'll call this from the modal's useEffect or form submit
  };

  const handleAskAI = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages((msgs) => [...msgs, { role: "user", text: userMessage }]);
    setChatInput(""); // Clear input immediately
    setChatLoading(true);

    try {
      // Prepare paper context (using filteredPapers for current view)
      const paperContext = filteredPapers
        .map(
          (paper) =>
            `- ${paper.course_name} (${paper.course_code}, ${paper.exam_name}, ${paper.exam_year})`
        )
        .join("\n");

      const fullPrompt =
        `You are an AI assistant helping a student find information about university papers and related topics.\n\n` +
        (paperContext
          ? `Here is a list of available papers for the selected university:\n\n${paperContext}\n\n`
          : "") +
        `Based on the provided context (if any) and general knowledge, please answer the following question:\n\n${userMessage}`;

      const res = await fetch("/api/ask-gemini", {
        method: "POST",
        body: JSON.stringify({ prompt: fullPrompt }), // Send the combined prompt and context
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setChatMessages((msgs) => [...msgs, { role: "ai", text: data.text }]);
    } catch (e) {
      console.error("Error fetching AI response:", e);
      setChatMessages((msgs) => [
        ...msgs,
        {
          role: "ai",
          text: "Sorry, something went wrong fetching the AI response.",
        },
      ]);
    }
    setChatLoading(false);
  };

  const generateShareUrl = () => {
    if (!selectedUniversityId) return "";
    const origin = window.location.origin;
    return `${origin}/home?universityId=${selectedUniversityId}`;
  };

  const handleShareClick = () => {
    const url = generateShareUrl();
    if (url) {
      setShareUrl(url);
      setShowShareModal(true);
    }
  };

  const handleCopyLink = async () => {
    if (navigator.clipboard && navigator.clipboard.writeText && shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset button text after 2 seconds
      } catch (err) {
        console.error("Failed to copy: ", err);
        alert("Failed to copy the link.");
      }
    } else {
      // Fallback for browsers that don't support the Clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in Microsoft Edge.
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset button text after 2 seconds
      } catch (err) {
        console.error("Oops, unable to copy", err);
        alert("Failed to copy the link.");
      }
      document.body.removeChild(textarea);
    }
  };

  return (
    <>
      <Head>
        <title>
          {selectedUniversity
            ? `${selectedUniversity} Papers - Papers Platform`
            : "Papers Platform"}
        </title>
        <meta name="google-adsense-account" content="ca-pub-2349705329371450" />
        <meta
          name="description"
          content="Find and access past question papers for your university. Search by course, exam, or year."
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2349705329371450"
          crossOrigin="anonymous"
        ></script>
      </Head>
      <Suspense fallback={<div>Loading home page...</div>}>
        <div className="min-h-screen bg-[#f7f9fb]">
          {/* Navbar */}
          <nav className="w-full flex items-center justify-between px-4 sm:px-8 py-3 bg-white border-b border-gray-200">
            <div className="flex items-center gap-2 sm:gap-8">
              <span className="font-bold text-lg sm:text-2xl tracking-tight flex items-center gap-1 sm:gap-2">
                Papers
              </span>
              <div className="hidden md:flex gap-6 text-sm font-medium text-gray-700">
                <a href="/home" className="hover:text-black">
                  Dashboard
                </a>
                <a href="/subjects" className="hover:text-black">
                  Subjects
                </a>
                <a href="/upload" className="hover:text-black">
                  Upload Paper
                </a>
              </div>
            </div>

            {/* Desktop/Tablet Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {/* University Dropdown - Desktop */}
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
              {/* Share Button - Desktop */}
              <button
                onClick={handleShareClick}
                className="bg-black text-white rounded-full px-4 py-2 font-semibold text-xs transition hover:bg-gray-800"
                disabled={!selectedUniversityId}
              >
                Share
              </button>
              {/* Profile Initials Dropdown - Desktop */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="w-9 h-9 rounded-full bg-[#d1e0e9] flex items-center justify-center font-bold text-lg text-[#2a3a4a] border border-gray-200 hover:shadow"
                  title="Profile"
                >
                  {getInitials() || "--"}
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden">
                    {/* Conditionally render Login or Profile Information */}
                    {!email && (
                      // Show Login if not logged in
                      <a
                        href="/login"
                        className="w-full block text-left px-4 py-3 hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Login
                      </a>
                    )}

                    {/* Always show Profile Information if logged in */}
                    {email && (
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => {
                          setDropdownOpen(false);
                          router.push("/profile");
                        }}
                      >
                        Profile Information
                      </button>
                    )}

                    {/* Always show Logout button */}
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors duration-200 text-red-600"
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout(); // This already redirects to /
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center justify-end flex-1 gap-4">
              {/* University Selector - Mobile */}
              <div className="flex-1 min-w-0">
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-black max-w-[140px]"
                  aria-label="Select university"
                >
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.name}>
                      {uni.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Share Button - Mobile */}
              <button
                onClick={handleShareClick}
                className="bg-black text-white rounded-full px-3 py-1.5 font-semibold text-xs transition hover:bg-gray-800"
                disabled={!selectedUniversityId}
              >
                Share
              </button>

              {/* Profile Button - Mobile */}
              <div className="relative" ref={mobileMenuRef}>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium"
                >
                  {getInitials()}
                </button>
                {/* Mobile Menu Dropdown */}
                <div
                  className={`absolute right-0 top-full mt-2 w-48 transition-all duration-300 ease-in-out z-50 ${
                    mobileMenuOpen
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 -translate-y-2 pointer-events-none"
                  }`}
                >
                  <div className="bg-white/80 backdrop-blur-[5px] rounded-lg shadow-lg p-2 space-y-2">
                    {/* Conditionally render Login or Profile Information */}
                    {!email ? (
                      // Show Login if not logged in
                      <a
                        href="/login"
                        className="block w-full text-center bg-black text-white rounded-full px-4 py-2 font-semibold text-xs transition hover:bg-gray-800"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </a>
                    ) : (
                      // Show Profile Information if logged in
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          router.push("/profile");
                        }}
                        className="block w-full text-center bg-black text-white rounded-full px-4 py-2 font-semibold text-xs transition hover:bg-gray-800"
                      >
                        Profile Information
                      </button>
                    )}

                    {/* Conditionally show Upload Paper and always show Subjects in mobile menu */}
                    {email && (
                      <a
                        href="/upload"
                        className="block w-full text-center bg-black text-white rounded-full px-4 py-2 font-semibold text-xs transition hover:bg-gray-800"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Upload Paper
                      </a>
                    )}

                    <a
                      href="/subjects"
                      className="block w-full text-center bg-black text-white rounded-full px-4 py-2 font-semibold text-xs transition hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Subjects
                    </a>

                    {/* Always show Logout button in mobile menu */}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-center bg-black text-white rounded-full px-4 py-2 font-semibold text-xs transition hover:bg-gray-800 text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-8 px-8 py-8 max-w-7xl mx-auto">
            {/* Left: Recent Papers */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold mb-6">
                {selectedUniversity} Papers
              </h2>
              <div className="mb-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by course name, code, exam name, or year"
                    className="w-full rounded-xl bg-[#e9eef3] px-4 py-3 pl-10 text-base border border-gray-200 focus:border-gray-400 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="absolute left-3 top-3 text-gray-400">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6Z"
                      />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {currentPapers.length === 0 && (
                  <div className="col-span-full text-gray-500 text-center py-8">
                    {searchTerm
                      ? "No papers found matching your search."
                      : "No papers found for this university."}
                  </div>
                )}
                {currentPapers.map((paper) => (
                  <div
                    key={paper.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col border border-gray-200 hover:border-gray-400 transition"
                  >
                    <div className="aspect-[1/1] bg-[#f2f4f7] flex items-center justify-center p-4">
                      <a
                        href={`/view/${paper.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-full flex items-center justify-center hover:bg-[#e9eef3] transition-colors rounded-xl"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <svg
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M8.707 4.293a1 1 0 0 1 0 1.414L5.414 9H17a1 1 0 1 1 0 2H5.414l3.293 3.293a1 1 0 0 1-1.414 1.414l-5-5a1 1 0 0 1 0-1.414l5-5a1 1 0 0 1 1.414 0Z"
                              fill="#6B7280"
                            />
                          </svg>
                          <span className="text-sm text-gray-600">
                            View PDF
                          </span>
                        </div>
                      </a>
                    </div>
                    <div className="p-4 flex flex-col gap-2">
                      <div className="font-semibold text-base">
                        {paper.course_name}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-[#d1e0e9] text-[#2a3a4a] rounded-full px-3 py-1">
                          {paper.course_code}
                        </span>
                        <span className="bg-[#c6d9b7] text-[#3a4a2a] rounded-full px-3 py-1">
                          {paper.exam_name}
                        </span>
                        <span className="bg-[#e9c6b7] text-[#4a3a2a] rounded-full px-3 py-1">
                          {paper.exam_year}
                        </span>
                      </div>
                      <div className="text-gray-400 text-xs">
                        Uploaded{" "}
                        {new Date(paper.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Pagination */}
              {filteredPapers.length > papersPerPage && (
                <div className="flex justify-center gap-4 mt-8">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="bg-black text-white font-semibold rounded-xl py-2 px-6 transition disabled:opacity-60"
                  >
                    Previous Page
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="bg-black text-white font-semibold rounded-xl py-2 px-6 transition disabled:opacity-60"
                  >
                    Next Page
                  </button>
                </div>
              )}
            </div>
            {/* Right: Ask AI */}
            <aside className="w-full lg:w-[320px] flex-shrink-0">
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h3 className="font-semibold text-lg mb-4">Ask AI</h3>
                <div className="flex flex-col gap-3 text-sm text-gray-700 mb-4">
                  <div className="font-medium">Suggested Prompts:</div>
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      className="text-left bg-[#e9eef3] hover:bg-[#dbe3ea] transition rounded-lg px-3 py-2 cursor-pointer"
                      onClick={() => handleSuggestedPromptClick(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <button
                  className="w-full bg-[#e9eef3] text-black font-semibold rounded-xl py-2 mt-2 hover:bg-[#dbe3ea] transition"
                  onClick={() => setShowChatModal(true)}
                >
                  Ask AI
                </button>
              </div>
            </aside>
          </div>

          {/* Chat Modal */}
          {showChatModal && (
            <>
              <div
                className="fixed inset-0 bg-black/40 z-40"
                onClick={() => setShowChatModal(false)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md shadow-xl relative flex flex-col h-[80vh]">
                  <button
                    className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-black"
                    onClick={() => setShowChatModal(false)}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                  <h4 className="text-lg font-semibold mb-2">Ask AI</h4>
                  <div className="flex-1 overflow-y-auto mb-4 border rounded-lg p-2 bg-[#f7f9fb]">
                    {chatMessages.length === 0 && (
                      <div className="text-gray-400 text-center py-8">
                        Ask anything about papers, exams, or universities!
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`mb-2 flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`px-4 py-2 rounded-xl max-w-[80%] text-sm ${
                            msg.role === "user"
                              ? "bg-black text-white"
                              : "bg-[#e9eef3] text-black"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start mb-2">
                        <div className="px-4 py-2 rounded-xl bg-[#e9eef3] text-black text-sm animate-pulse">
                          Thinking...
                        </div>
                      </div>
                    )}
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAskAI();
                    }}
                    autoComplete="off"
                  >
                    <input
                      type="text"
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-2 bg-white text-base focus:border-black outline-none"
                      placeholder="Type your question..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatLoading}
                    />
                    <button
                      type="submit"
                      className="bg-black text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-60"
                      disabled={chatLoading || !chatInput.trim()}
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* Share Modal */}
          {showShareModal && shareUrl && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm flex flex-col items-center relative">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
                  aria-label="Close"
                >
                  &times;
                </button>
                <h3 className="text-lg font-semibold mb-4">Share Link</h3>
                <div className="w-full bg-gray-100 p-3 rounded-lg mb-4 break-all text-center text-sm border border-gray-300 text-black">
                  {shareUrl}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="bg-black text-white px-6 py-2 rounded-full font-semibold text-base transition hover:bg-gray-800"
                >
                  {copied ? "Link Copied!" : "Copy Link"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Suspense>
    </>
  );
}
