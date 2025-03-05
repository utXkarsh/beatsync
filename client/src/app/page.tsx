"use client";
import { Syncer } from "@/components/Syncer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export default function Home() {
  const [showSyncer, setShowSyncer] = useState(false);

  if (!showSyncer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">SyncBeat</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              size="lg"
              onClick={() => {
                // This ensures we have user interaction before audio can play
                setShowSyncer(true);
              }}
            >
              Enter Full Experience
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Syncer />;
}
