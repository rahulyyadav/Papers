"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabaseClient";

interface UserProfile {
  first_name: string;
  last_name: string;
}

interface QuestionPaper {
  pdf_url: string;
  user_id: string;
  user_profiles: UserProfile;
}

export default function PDFViewer({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [pdfUrl, setPdfUrl] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [showChatModal, setShowChatModal] = useState(false); // State for toggling chat modal
  const [rating, setRating] = useState(0); // State for star rating
  const [comment, setComment] = useState(""); // State for comment input

  // Chat states
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    async function getPdf() {
      try {
        const { data, error } = (await supabase
          .from("question-papers")
          .select(
            `
            pdf_url,
            user_id,
            user_profiles (
              first_name,
              last_name
            )
          `
          )
          .eq("id", id)
          .single()) as { data: QuestionPaper | null; error: any };

        if (error) {
          console.error("Error loading PDF:", error);
          return;
        }

        if (data?.pdf_url) {
          setPdfUrl(data.pdf_url);
        }

        if (data?.user_profiles) {
          const { first_name, last_name } = data.user_profiles;
          setUploaderName(`${first_name} ${last_name}`);
        }
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    }

    getPdf();
  }, [id]);

  const handleStarClick = (star: number) => {
    setRating(star);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComment(e.target.value);
  };

  const handleSendComment = () => {
    console.log("Comment sent:", comment);
    // TODO: Implement comment sending logic
    setComment(""); // Clear input after sending
  };

  const handleAskAI = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages((msgs) => [...msgs, { role: "user", text: userMessage }]);
    setChatInput(""); // Clear input immediately
    setChatLoading(true);

    try {
      // For now, sending just the user message. Context from the specific PDF can be added later.
      const fullPrompt = userMessage;

      const res = await fetch("/api/ask-gemini", {
        method: "POST",
        body: JSON.stringify({ prompt: fullPrompt }),
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

  if (!pdfUrl) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading PDF...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen relative">
      {/* PDF Viewer Section - 3/5 width */}
      <div className="w-3/5 h-full overflow-hidden bg-gray-100">
        <iframe
          src={pdfUrl}
          className="w-full h-full border-0"
          title="PDF Viewer"
        />
      </div>

      {/* Sidebar Section - 2/5 width */}
      <div className="w-2/5 h-full bg-white p-6 flex flex-col rounded-2xl shadow-lg transition duration-300 hover:shadow-xl">
        {/* Ask AI Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowChatModal(true)}
            className="w-full bg-black text-white px-6 py-2 rounded-full text-base font-semibold transition hover:bg-gray-800"
          >
            Ask AI
          </button>
        </div>

        {/* Rating Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rate question quality</h2>
          <div className="flex items-center space-x-1 text-yellow-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-6 h-6 cursor-pointer ${
                  star <= rating ? "text-yellow-500" : "text-gray-300"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
                onClick={() => handleStarClick(star)}
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.691h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.293z"></path>
              </svg>
            ))}
          </div>
        </div>

        {/* Uploaded By Section */}
        <div className="mb-6 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-600">Uploaded by:</h4>
          <p className="text-gray-800 text-sm">
            {uploaderName || "Loading..."}
          </p>
        </div>

        {/* Comment Input Section */}
        <div className="mt-auto flex items-center space-x-2">
          <input
            type="text"
            className="flex-grow p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write a comment..."
            value={comment}
            onChange={handleCommentChange}
          />
          <button
            onClick={handleSendComment}
            className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition flex items-center justify-center"
            aria-label="Send Comment"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-md h-3/4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">AI Chat</h3>
              <button
                onClick={() => setShowChatModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            {/* Gemini chat interface */}
            <div className="flex-grow border rounded-md p-4 overflow-y-auto text-black space-y-4">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 text-sm ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-black"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg p-3 text-sm bg-gray-200 text-black">
                    Loading...
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <input
                type="text"
                className="flex-grow p-2 border rounded-md"
                placeholder="Ask a question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAskAI();
                  }
                }}
              />
              <button
                onClick={handleAskAI}
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
                disabled={chatLoading}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
