"use client";
import { AudioUploader } from "../AudioUploader";
import { UploadHistory } from "../UploadHistory";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export const MusicUpload = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload Music</CardTitle>
        </CardHeader>
        <CardContent>
          <AudioUploader />
        </CardContent>
      </Card>

      <UploadHistory />
    </div>
  );
};
