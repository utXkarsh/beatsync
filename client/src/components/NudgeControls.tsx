"use client";

import React from "react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface NudgeControlsProps {
  nudgeAmount: number;
  totalNudge: number;
  onNudgeForward: () => void;
  onNudgeBackward: () => void;
  onNudgeAmountChange: (amount: number) => void;
  isPlaying: boolean;
}

export const NudgeControls: React.FC<NudgeControlsProps> = ({
  nudgeAmount,
  totalNudge,
  onNudgeForward,
  onNudgeBackward,
  onNudgeAmountChange,
  isPlaying,
}) => {
  return (
    <div className="mt-4 p-4 border rounded max-w-md w-full">
      <h3 className="font-bold mb-2">Microscopic Timing Controls</h3>
      <div className="flex items-center justify-between mb-2">
        <span>Nudge Amount: {nudgeAmount} ms</span>
        <div className="flex gap-2">
          <Button
            onClick={() =>
              onNudgeAmountChange(Math.max(1, Math.floor(nudgeAmount / 2)))
            }
            variant="outline"
            size="sm"
          >
            ÷2
          </Button>
          <Button
            onClick={() =>
              onNudgeAmountChange(Math.min(1000, Math.floor(nudgeAmount * 2)))
            }
            variant="outline"
            size="sm"
          >
            ×2
          </Button>
          <Select
            value={String(nudgeAmount)}
            onValueChange={(value) => onNudgeAmountChange(Number(value))}
            defaultValue="10"
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Nudge amount" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 ms</SelectItem>
              <SelectItem value="5">5 ms</SelectItem>
              <SelectItem value="10">10 ms</SelectItem>
              <SelectItem value="20">20 ms</SelectItem>
              <SelectItem value="50">50 ms</SelectItem>
              <SelectItem value="100">100 ms</SelectItem>
              <SelectItem value="250">250 ms</SelectItem>
              <SelectItem value="500">500 ms</SelectItem>
              <SelectItem value="1000">1000 ms (1s)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 justify-center">
        <Button
          onClick={onNudgeBackward}
          variant="secondary"
          size="default"
          disabled={!isPlaying}
        >
          ◀ Slow Down
        </Button>
        <Button
          onClick={onNudgeForward}
          variant="secondary"
          size="default"
          disabled={!isPlaying}
        >
          Speed Up ▶
        </Button>
      </div>
      <div className="mt-2 text-center">
        Total adjustment: {totalNudge > 0 ? "+" : ""}
        {totalNudge} ms ({(totalNudge / 1000).toFixed(3)} s)
      </div>
    </div>
  );
};
