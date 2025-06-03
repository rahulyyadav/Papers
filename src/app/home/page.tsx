"use client";

import { Suspense } from "react";
import HomeContent from "@/app/home/HomeContent";

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading content...</div>}>
      <HomeContent />
    </Suspense>
  );
}
