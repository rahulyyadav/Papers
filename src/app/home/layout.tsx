import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Papers Platform - Home",
  description:
    "Browse question papers by university, search, and interact with AI.",
  other: {
    "google-adsense-account": "ca-pub-2349705329371450",
  },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
