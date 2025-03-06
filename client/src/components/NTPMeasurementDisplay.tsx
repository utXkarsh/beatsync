"use client";

import { NTPMeasurement } from "@/types/audio";
import React from "react";
import { Button } from "./ui/button";

interface NTPMeasurementDisplayProps {
  ntpMeasurements: NTPMeasurement[];
  averageRoundTrip: number | null;
  averageOffset: number | null;
  isMeasuring: boolean;
  onMeasure: () => void;
  isConnected: boolean;
}

export const NTPMeasurementDisplay: React.FC<NTPMeasurementDisplayProps> = ({
  ntpMeasurements,
  averageRoundTrip,
  averageOffset,
  isMeasuring,
  onMeasure,
  isConnected,
}) => {
  if (ntpMeasurements.length === 0 && !isMeasuring) {
    return (
      <Button
        onClick={onMeasure}
        className="mt-4"
        disabled={isMeasuring || !isConnected}
      >
        Run NTP Measurements (20x)
      </Button>
    );
  }

  return (
    <div className="mt-4">
      <Button
        onClick={onMeasure}
        className="mb-4"
        disabled={isMeasuring || !isConnected}
      >
        {isMeasuring ? "Measuring..." : "Run NTP Measurements (20x)"}
      </Button>

      {ntpMeasurements.length > 0 && (
        <div className="p-4 border rounded max-w-md w-full">
          <h3 className="font-bold">NTP Measurements</h3>
          <p>Measurements: {ntpMeasurements.length}</p>
          {averageRoundTrip !== null && (
            <p>Average Round-trip Delay: {averageRoundTrip.toFixed(2)}ms</p>
          )}
          {averageOffset !== null && (
            <p>Average Clock Offset: {averageOffset.toFixed(2)}ms</p>
          )}
        </div>
      )}
    </div>
  );
};
