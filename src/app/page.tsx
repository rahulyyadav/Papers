"use client";

import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Papers Platform - Share, Earn, and Learn</title>
        <meta
          name="description"
          content="Share your past university exam question papers, earn revenue from views, and access academic resources."
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2349705329371450"
          crossOrigin="anonymous"
        ></script>
      </Head>
      <div className="min-h-screen flex flex-col bg-white text-black relative">
        {/* Header */}
        <header className="w-full flex justify-between items-center px-6 py-4 border-b border-gray-100 text-sm">
          <span className="font-bold text-lg tracking-tight">
            Papers<sup className="text-xs align-super">™</sup>
          </span>
          <nav className="space-x-6 hidden md:flex items-center">
            <a
              href="https://github.com/rahulyyadav/Papers.git"
              className="hover:underline"
            >
              Contribute
            </a>
            <a href="/revenue-model" className="hover:underline">
              Revenue Model
            </a>
            <a
              href="/login"
              className="bg-black text-white rounded-full px-4 py-2 font-semibold text-xs transition hover:bg-gray-800 cursor-pointer"
            >
              Login
            </a>
            <a
              href="/signup"
              className="bg-black text-white rounded-full px-4 py-2 font-semibold text-xs transition hover:bg-gray-800 cursor-pointer"
            >
              Sign Up
            </a>
          </nav>
          <nav className="block md:hidden">
            <button className="p-2">☰</button>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full flex flex-col items-center px-4 sm:px-8 max-w-6xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mt-10 mb-8 text-center">
            Questions
          </h1>
          {/* Hero Section (Updated with Animated Text and Handwritten Font)*/}
          <div className="w-full max-w-3xl aspect-[3/1] bg-gray-100 rounded-xl mb-12 flex items-center justify-center overflow-hidden">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center overflow-hidden whitespace-nowrap animate-writing leading-tight font-sacramento">
              Helping Others. Earning More.
            </h1>
          </div>
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full mb-16">
            {/* Upload & Earn */}
            <div className="flex flex-col items-start bg-gray-50 rounded-xl p-6 min-h-[180px]">
              <div className="w-12 h-12 bg-gray-200 rounded mb-4 flex items-center justify-center">
                <span className="text-2xl">■</span>
              </div>
              <h2 className="font-semibold mb-1">Upload & Earn.</h2>
              <p className="text-sm text-gray-600">
                Contributors get paid for every verified university exam paper
                they upload.
              </p>
            </div>
            {/* Browse Exams */}
            <div className="flex flex-col items-start bg-gray-50 rounded-xl p-6 min-h-[180px]">
              <div className="w-12 h-12 bg-gray-200 rounded mb-4 flex items-center justify-center">
                <span className="text-2xl">●</span>
              </div>
              <h2 className="font-semibold mb-1">Browse Exams.</h2>
              <p className="text-sm text-gray-600">
                Search and download past questions filtered by university,
                subject, or semester.
              </p>
            </div>
            {/* Rate & Review */}
            <div className="flex flex-col items-start bg-gray-50 rounded-xl p-6 min-h-[180px] md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-gray-200 rounded mb-4 flex items-center justify-center">
                <span className="text-2xl">▲</span>
              </div>
              <h2 className="font-semibold mb-1">Rate & Review.</h2>
              <p className="text-sm text-gray-600">
                Users can rate questions and review quality, helping surface the
                best content.
              </p>
            </div>
          </div>
          {/* Call to Action */}
          <section className="w-full flex flex-col items-center my-16">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center">
              Join. Upload. Get Rewarded.
            </h2>
            <p className="mb-4 text-center text-gray-700 max-w-md">
              Sign up now to start sharing and accessing university exam
              questions and answers.
            </p>
            <a
              href="/signup"
              className="bg-black text-white rounded-full px-6 py-3 font-semibold text-base hover:bg-gray-900 transition cursor-pointer"
            >
              Sign up free
            </a>
          </section>
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-gray-100 py-8 px-6 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white mt-auto">
          <div className="text-gray-400">
            All rights reserved © Rahul Yadav.
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-8">
            <div>
              <div className="font-semibold text-gray-700 mb-1">Platform</div>
              <div className="text-gray-500">
                <a href="/revenue-model" className="hover:underline">
                  Revenue Model
                </a>
              </div>
              <div className="text-gray-500">
                <a
                  href="https://github.com/rahulyyadav/Papers.git"
                  className="hover:underline"
                >
                  Contribute to Open Source
                </a>
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 mb-1">Account</div>
              <div className="text-gray-500">
                <a href="/login" className="hover:underline">
                  Login
                </a>
              </div>
              <div className="text-gray-500">
                <a href="/signup" className="hover:underline">
                  Sign Up
                </a>
              </div>
            </div>
          </div>
        </footer>

        <style jsx>{`
          @keyframes writing {
            from {
              width: 0;
            }
            to {
              width: 100%;
            }
          }
          .animate-writing {
            overflow: hidden; /* Ensures the content is not revealed until the animation */
            white-space: nowrap; /* Keeps the content on a single line */
            margin: 0 auto; /* Gives that typewriter effect by centering it */
            animation: writing 4s linear forwards; /* Use linear timing for smoother effect, adjust duration for speed */
          }
        `}</style>
      </div>
    </>
  );
}
