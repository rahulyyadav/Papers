"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import ReactMarkdown from "react-markdown";

interface UserProfile {
  first_name: string;
  last_name: string;
}

interface QuestionPaper {
  pdf_url: string;
  user_id: string;
  user_profiles: UserProfile;
}

interface Comment {
  id: string;
  user_id: string;
  paper_id: string;
  comment: string;
  created_at: string;
  user_profiles: {
    first_name: string;
    last_name: string;
  };
}

interface Rating {
  id: string;
  user_id: string;
  paper_id: string;
  rating: number;
  created_at: string;
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
  const [user, setUser] = useState<any>(null); // Current user
  const [comments, setComments] = useState<Comment[]>([]); // All comments
  const [userRating, setUserRating] = useState<Rating | null>(null); // Current user's rating
  const [averageRating, setAverageRating] = useState(0); // Average rating
  const [totalRatings, setTotalRatings] = useState(0); // Total number of ratings
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Chat states
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    async function getPdf() {
      try {
        // Check authentication status
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

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
        } else {
          // No user profile data found for this paper
        }
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    }

    getPdf();
  }, [id]);

  // Function to fetch comments and ratings
  const fetchCommentsAndRatings = async () => {
    if (!id) return;

    try {
      // Fetch comments first
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("id, user_id, paper_id, comment, created_at")
        .eq("paper_id", id)
        .order("created_at", { ascending: false });

      console.log("Comments fetch result:", { commentsData, commentsError });

      if (!commentsError && commentsData) {
        // Fetch user profiles for all commenters
        const userIds = [...new Set(commentsData.map((c) => c.user_id))];
        const { data: userProfiles, error: profilesError } = await supabase
          .from("user_profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", userIds);

        if (!profilesError && userProfiles) {
          // Create a map of user_id to profile
          const profileMap = userProfiles.reduce((map, profile) => {
            map[profile.user_id] = profile;
            return map;
          }, {} as Record<string, any>);

          // Combine comments with user profiles
          const commentsWithProfiles = commentsData.map((comment) => ({
            ...comment,
            user_profiles: profileMap[comment.user_id] || {
              first_name: "Unknown",
              last_name: "User",
            },
          }));

          // Sort comments: current user's comment first, then others by date
          const sortedComments = commentsWithProfiles.sort((a, b) => {
            if (user && a.user_id === user.id && b.user_id !== user.id)
              return -1;
            if (user && b.user_id === user.id && a.user_id !== user.id)
              return 1;
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          });
          setComments(sortedComments);
        } else {
          console.error("Error fetching user profiles:", profilesError);
          setComments([]);
        }
      } else if (commentsError) {
        console.error("Error fetching comments:", commentsError);
        setComments([]);
      }

      // Fetch average rating and total ratings
      const { data: ratingStats, error: ratingStatsError } = await supabase
        .from("ratings")
        .select("rating")
        .eq("paper_id", id);

      console.log("Ratings fetch result:", { ratingStats, ratingStatsError });

      if (!ratingStatsError && ratingStats) {
        const total = ratingStats.length;
        const average =
          total > 0
            ? ratingStats.reduce((sum, r) => sum + r.rating, 0) / total
            : 0;
        setTotalRatings(total);
        setAverageRating(Math.round(average * 10) / 10); // Round to 1 decimal
      } else if (ratingStatsError) {
        console.error("Error fetching ratings:", ratingStatsError);
        setTotalRatings(0);
        setAverageRating(0);
      }

      // If user is logged in, fetch their rating
      if (user) {
        const { data: userRatingData, error: userRatingError } = await supabase
          .from("ratings")
          .select("*")
          .eq("paper_id", id)
          .eq("user_id", user.id)
          .single();

        if (!userRatingError && userRatingData) {
          setUserRating(userRatingData);
          setRating(userRatingData.rating);
        }
      }
    } catch (error) {
      console.error("Error fetching comments and ratings:", error);
    }
  };

  // Fetch comments and ratings
  useEffect(() => {
    fetchCommentsAndRatings();
  }, [id, user]);

  const handleStarClick = async (star: number) => {
    if (!user) return;

    setRating(star);
    setIsSubmittingRating(true);

    try {
      if (userRating) {
        // Update existing rating
        const { error } = await supabase
          .from("ratings")
          .update({ rating: star, created_at: new Date().toISOString() })
          .eq("id", userRating.id);

        if (!error) {
          setUserRating({ ...userRating, rating: star });
        }
      } else {
        // Create new rating
        const { data, error } = await supabase
          .from("ratings")
          .insert({
            user_id: user.id,
            paper_id: id,
            rating: star,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (!error && data) {
          setUserRating(data);
        }
      }

      // Refresh average rating immediately
      await fetchCommentsAndRatings();
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComment(e.target.value);
  };

  const handleCommentKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const handleSendComment = async () => {
    if (!user || !comment.trim()) return;

    setIsSubmittingComment(true);

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          user_id: user.id,
          paper_id: id,
          comment: comment.trim(),
          created_at: new Date().toISOString(),
        })
        .select("id, user_id, paper_id, comment, created_at")
        .single();

      if (!error && data) {
        setComment(""); // Clear input after sending
        // Refresh comments to get proper ordering
        await fetchCommentsAndRatings();
      } else if (error) {
        console.error("Error submitting comment:", error);
        alert("Failed to submit comment. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
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
        body: JSON.stringify({ question: userMessage }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setChatMessages((msgs) => [...msgs, { role: "ai", text: data.text }]);
    } catch (e) {
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
    <div className="flex flex-col md:flex-row h-screen relative">
      {/* PDF Viewer Section */}
      <div className="flex-1 h-4/5 md:h-full overflow-hidden bg-gray-100 w-full">
        <iframe
          src={pdfUrl}
          className="w-full h-full border-0 p-0 m-0 block"
          title="PDF Viewer"
        />
      </div>

      {/* Mobile Bottom Section */}
      <div className="md:hidden flex flex-col h-1/5 bg-white p-6 overflow-y-auto">
        {/* Ask AI Button - Mobile */}
        <div className="mb-4">
          <button
            onClick={() => setShowChatModal(true)}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-semibold transition hover:bg-blue-700"
          >
            Ask AI
          </button>
        </div>

        {/* Rating Section - Mobile */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Rating</h2>
            <div className="text-sm text-gray-600">
              {averageRating > 0
                ? `${averageRating}/5 (${totalRatings} ratings)`
                : "No ratings yet"}
            </div>
          </div>
          <div className="flex items-center space-x-1 text-yellow-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-6 h-6 ${
                  user ? "cursor-pointer" : "cursor-not-allowed"
                } ${star <= rating ? "text-yellow-500" : "text-gray-300"} ${
                  isSubmittingRating ? "opacity-50" : ""
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
                onClick={() =>
                  user && !isSubmittingRating && handleStarClick(star)
                }
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.691h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.293z"></path>
              </svg>
            ))}
          </div>
          {!user && (
            <p className="text-xs text-gray-500 mt-1">
              Login to rate this paper
            </p>
          )}
        </div>

        {/* Uploaded By Section - Mobile */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-600">Uploaded by:</h4>
          {/* Placeholder for avatar and name */}{" "}
          {/* Replace with actual avatar and name */}
          <div className="flex items-center mt-1">
            <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-medium mr-2">
              {uploaderName ? uploaderName[0].toUpperCase() : "?"}
            </div>
            <p className="text-gray-800 text-sm">
              {uploaderName || "Loading..."}
            </p>
          </div>
        </div>

        {/* Comments Section - Mobile */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3">
            Comments ({comments.length})
          </h3>
          <div className="space-y-3 max-h-32 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-sm">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg ${
                    user && comment.user_id === user.id
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-medium ${
                        user && comment.user_id === user.id
                          ? "bg-blue-600"
                          : "bg-blue-500"
                      }`}
                    >
                      {comment.user_profiles?.first_name?.[0]?.toUpperCase() ||
                        "U"}
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      {comment.user_profiles?.first_name}{" "}
                      {comment.user_profiles?.last_name}
                      {user && comment.user_id === user.id && (
                        <span className="text-xs text-blue-600 ml-1">
                          (You)
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Comment Input Section - Mobile */}
        {user ? (
          <div className="mt-auto flex items-center space-x-2">
            <input
              type="text"
              className="flex-grow p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write a comment..."
              value={comment}
              onChange={handleCommentChange}
              onKeyPress={handleCommentKeyPress}
              disabled={isSubmittingComment}
            />
            <button
              onClick={handleSendComment}
              disabled={!comment.trim() || isSubmittingComment}
              className="bg-blue-600 text-white w-10 h-10 rounded-full hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50"
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
        ) : (
          <div className="mt-auto text-center">
            <p className="text-sm text-gray-500">Login to comment</p>
          </div>
        )}
      </div>

      {/* Desktop/Tablet Sidebar */}
      <div className="hidden md:flex w-[36%] h-full bg-white p-6 flex-col rounded-2xl shadow-lg transition duration-300 hover:shadow-xl">
        {/* Ask AI Button - Desktop/Tablet */}
        <div className="mb-6">
          <button
            onClick={() => setShowChatModal(true)}
            className="w-full bg-black text-white px-6 py-2 rounded-full text-base font-semibold transition hover:bg-gray-800"
          >
            Ask AI
          </button>
        </div>

        {/* Rating Section - Desktop/Tablet */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Rating</h2>
            <div className="text-sm text-gray-600">
              {averageRating > 0
                ? `${averageRating}/5 (${totalRatings} ratings)`
                : "No ratings yet"}
            </div>
          </div>
          <div className="flex items-center space-x-1 text-yellow-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-6 h-6 ${
                  user ? "cursor-pointer" : "cursor-not-allowed"
                } ${star <= rating ? "text-yellow-500" : "text-gray-300"} ${
                  isSubmittingRating ? "opacity-50" : ""
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
                onClick={() =>
                  user && !isSubmittingRating && handleStarClick(star)
                }
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.691h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.293z"></path>
              </svg>
            ))}
          </div>
          {!user && (
            <p className="text-xs text-gray-500 mt-1">
              Login to rate this paper
            </p>
          )}
        </div>

        {/* Uploaded By Section - Desktop/Tablet */}
        <div className="mb-6 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-600">Uploaded by:</h4>
          {/* Placeholder for avatar and name */}{" "}
          {/* Replace with actual avatar and name */}
          <div className="flex items-center mt-1">
            <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-medium mr-2">
              {uploaderName ? uploaderName[0].toUpperCase() : "?"}
            </div>
            <p className="text-gray-800 text-sm">
              {uploaderName || "Loading..."}
            </p>
          </div>
        </div>

        {/* Comments Section - Desktop/Tablet */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            Comments ({comments.length})
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-sm">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg ${
                    user && comment.user_id === user.id
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-medium ${
                        user && comment.user_id === user.id
                          ? "bg-blue-600"
                          : "bg-blue-500"
                      }`}
                    >
                      {comment.user_profiles?.first_name?.[0]?.toUpperCase() ||
                        "U"}
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      {comment.user_profiles?.first_name}{" "}
                      {comment.user_profiles?.last_name}
                      {user && comment.user_id === user.id && (
                        <span className="text-xs text-blue-600 ml-1">
                          (You)
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Comment Input Section - Desktop/Tablet */}
        {user ? (
          <div className="mt-auto flex items-center space-x-2">
            <input
              type="text"
              className="flex-grow p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write a comment..."
              value={comment}
              onChange={handleCommentChange}
              onKeyPress={handleCommentKeyPress}
              disabled={isSubmittingComment}
            />
            <button
              onClick={handleSendComment}
              disabled={!comment.trim() || isSubmittingComment}
              className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition flex items-center justify-center disabled:opacity-50"
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
        ) : (
          <div className="mt-auto text-center">
            <p className="text-sm text-gray-500">Login to comment</p>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed top-0 right-0 z-50 w-full max-w-md h-full bg-white shadow-2xl border-l border-gray-200 flex flex-col">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <h4 className="text-lg font-semibold text-gray-800">Ask AI</h4>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setShowChatModal(false)}
              aria-label="Close"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {chatMessages.length === 0 && (
              <div className="text-gray-400 text-center py-8">
                Ask anything about this paper or related topics!
              </div>
            )}
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`mb-3 flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  }`}
                >
                  {message.role === "user" ? (
                    message.text
                  ) : (
                    <ReactMarkdown
                      components={{
                        // Custom styling for different markdown elements
                        h1: ({ children }) => (
                          <h1 className="text-lg font-bold mb-2 text-gray-900">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-base font-bold mb-2 text-gray-900">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-sm font-bold mb-1 text-gray-900">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="mb-2 text-gray-800">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-bold text-gray-900">
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic text-gray-800">{children}</em>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-2 space-y-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-2 space-y-1">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-gray-800">{children}</li>
                        ),
                        code: ({ children, className }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">
                              {children}
                            </code>
                          ) : (
                            <code className="block bg-gray-100 p-2 rounded text-sm font-mono text-gray-800 overflow-x-auto">
                              {children}
                            </code>
                          );
                        },
                        pre: ({ children }) => (
                          <pre className="bg-gray-100 p-2 rounded text-sm font-mono text-gray-800 overflow-x-auto mb-2">
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 mb-2">
                            {children}
                          </blockquote>
                        ),
                        a: ({ children, href }) => (
                          <a
                            href={href}
                            className="text-blue-600 hover:text-blue-800 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start mb-3">
                <div className="px-4 py-3 rounded-2xl bg-white text-gray-800 text-sm border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input form */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <form
              className="flex gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAI();
              }}
              autoComplete="off"
            >
              <input
                type="text"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 bg-white text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="Type your question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white font-semibold rounded-xl px-6 py-3 disabled:opacity-60 hover:bg-blue-700 transition-colors"
                disabled={chatLoading || !chatInput.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
