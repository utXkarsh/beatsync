"use client";
import { Join } from "@/components/Join";
import { Syncer } from "@/components/Syncer";
import { useState } from "react";

export default function Home() {
  const [showSyncer, setShowSyncer] = useState(false);

  if (!showSyncer) {
    return <Join />;
  }

  return <Syncer />;
}
