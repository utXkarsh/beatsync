"use client";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { generateName as generateUsername } from "@/lib/randomNames";
import { validateFullRoomId, validatePartialRoomId } from "@/lib/room";
import { useRoomStore } from "@/store/room";
import { motion } from "framer-motion";
import { LogIn, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface JoinFormData {
  roomId: string;
  username: string;
}

export const Join = () => {
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const setRoomId = useRoomStore((state) => state.setRoomId);
  const setUsername = useRoomStore((state) => state.setUsername);

  const {
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
  } = useForm<JoinFormData>({
    defaultValues: {
      roomId: "",
      username: "",
    },
  });

  useEffect(() => {
    // Set a random username when component mounts
    setValue("username", generateUsername());
  }, [setValue]);

  const router = useRouter();
  const username = watch("username");

  const onSubmit = (data: JoinFormData) => {
    setIsJoining(true);
    // Validate roomId
    if (!validateFullRoomId(data.roomId)) {
      toast.error("Invalid room code. Please enter 6 digits.");
      setIsJoining(false);
      return;
    }

    console.log("Joining room with data:", data);
    setRoomId(data.roomId);
    setUsername(data.username);
    router.push(`/room/${data.roomId}`);
  };

  const handleCreateRoom = () => {
    setIsCreating(true);

    // Generate a random 6-digit room ID
    const newRoomId = Math.floor(100000 + Math.random() * 900000).toString();

    setRoomId(newRoomId);
    setUsername(username);
    router.push(`/room/${newRoomId}`);
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-neutral-950 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full px-1">
        <motion.div
          className="flex flex-col items-center justify-center p-6 bg-neutral-900 rounded-lg border border-neutral-800 shadow-xl max-w-[28rem] mx-auto"
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.h2
            className="text-base font-medium tracking-tight mb-1 text-white"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Join a Beatsync Room
          </motion.h2>

          <motion.p
            className="text-neutral-400 mb-5 text-center text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            Enter a room code to join or create a new room
          </motion.p>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Controller
                control={control}
                name="roomId"
                rules={{ required: "Room code is required" }}
                render={({ field }) => (
                  <InputOTP
                    autoFocus
                    maxLength={6}
                    inputMode="numeric"
                    value={field.value}
                    onChange={(value) => {
                      // Only set the value if it contains only digits
                      if (validatePartialRoomId(value)) {
                        field.onChange(value);
                      }
                    }}
                    className="gap-2"
                  >
                    <InputOTPGroup className="gap-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="w-9 h-10 text-base bg-neutral-800/80 border-neutral-700 transition-all duration-200 
                          focus-within:border-primary/70 focus-within:bg-neutral-800 focus-within:ring-1 focus-within:ring-primary/30"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
            </motion.div>
            {errors.roomId && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-xs text-red-500 text-center mt-1"
              >
                {errors.roomId.message}
              </motion.p>
            )}

            <motion.div
              className="flex items-center justify-center mt-5"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              <div className="text-sm text-neutral-400">
                You&apos;ll join as{" "}
                <span className="text-primary font-medium">{username}</span>
              </div>
              <Button
                type="button"
                onClick={() => setValue("username", generateUsername())}
                variant="ghost"
                className="text-xs text-neutral-500 hover:text-neutral-300 ml-2 h-6 px-2"
                disabled={isJoining || isCreating}
              >
                Regenerate
              </Button>
            </motion.div>

            <div className="flex flex-col gap-3 mt-5">
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                whileHover={!isJoining && !isCreating ? { scale: 1.02 } : {}}
                whileTap={!isJoining && !isCreating ? { scale: 0.98 } : {}}
              >
                <Button
                  type="submit"
                  className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium text-sm cursor-pointer transition-all duration-300 flex items-center justify-center"
                  disabled={isJoining || isCreating}
                >
                  {isJoining ? (
                    <motion.div
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear",
                      }}
                    >
                      <LogIn size={16} className="mr-2" />
                    </motion.div>
                  ) : (
                    <LogIn size={16} className="mr-2" />
                  )}
                  <span>{isJoining ? "Joining..." : "Join room"}</span>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                whileHover={!isJoining && !isCreating ? { scale: 1.02 } : {}}
                whileTap={!isJoining && !isCreating ? { scale: 0.98 } : {}}
              >
                <Button
                  type="button"
                  onClick={handleCreateRoom}
                  className="w-full px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full font-medium text-sm cursor-pointer transition-all duration-300 flex items-center justify-center"
                  disabled={isJoining || isCreating}
                >
                  {isCreating ? (
                    <motion.div
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear",
                      }}
                    >
                      <PlusCircle size={16} className="mr-2" />
                    </motion.div>
                  ) : (
                    <PlusCircle size={16} className="mr-2" />
                  )}
                  <span>{isCreating ? "Creating..." : "Create room"}</span>
                </Button>
              </motion.div>
            </div>
          </form>

          <motion.p
            className="text-neutral-500 mt-5 text-center text-xs leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            For best experience, use a laptop with Chrome browser. Only use the
            native device speakers, and make sure silent mode is off.
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
};
