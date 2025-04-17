"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { validateFullRoomId, validatePartialRoomId } from "@/lib/room";
import { useRoomStore } from "@/store/room";
import { motion } from "framer-motion";
import { LogIn, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface JoinFormData {
  roomId: string;
  username: string;
}

export const Join = () => {
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const setRoomId = useRoomStore((state) => state.setRoomId);
  const setUsername = useRoomStore((state) => state.setUsername);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm<JoinFormData>({
    defaultValues: {
      roomId: "",
      username: "",
    },
  });

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
    if (!username) {
      toast.error("Please enter a username first");
      usernameInputRef.current?.focus();
      return;
    }

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
      transition={{ duration: 0.3 }}
    >
      <div className="w-full px-1">
        <motion.div
          className="flex flex-col items-center justify-center p-5 bg-neutral-900 rounded-md border border-neutral-800 shadow-lg max-w-[26rem] mx-auto"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <motion.h2
            className="text-sm font-medium tracking-tight mb-1 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            Join a Beatsync Room
          </motion.h2>

          <motion.p
            className="text-neutral-400 mb-4 text-center text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            Enter a room code and choose a username
          </motion.p>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
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
                        // Focus the username input after OTP is complete
                        if (value.length === 6 && usernameInputRef.current) {
                          usernameInputRef.current.focus();
                        }
                      }
                    }}
                    className="gap-2"
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot
                        index={0}
                        className="w-9 h-10 text-base bg-neutral-800 border-neutral-700"
                      />
                      <InputOTPSlot
                        index={1}
                        className="w-9 h-10 text-base bg-neutral-800 border-neutral-700"
                      />
                      <InputOTPSlot
                        index={2}
                        className="w-9 h-10 text-base bg-neutral-800 border-neutral-700"
                      />
                      <InputOTPSlot
                        index={3}
                        className="w-9 h-10 text-base bg-neutral-800 border-neutral-700"
                      />
                      <InputOTPSlot
                        index={4}
                        className="w-9 h-10 text-base bg-neutral-800 border-neutral-700"
                      />
                      <InputOTPSlot
                        index={5}
                        className="w-9 h-10 text-base bg-neutral-800 border-neutral-700"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
            </motion.div>
            {errors.roomId && (
              <p className="text-xs text-red-500 text-center mt-1">
                {errors.roomId.message}
              </p>
            )}

            <motion.div
              className="space-y-1 mt-4"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <label className="text-xs text-neutral-400">Username</label>
              <Input
                className="bg-neutral-800 border-neutral-700 focus:border-neutral-600 mt-0.5 h-8 text-xs"
                placeholder="Choose a username"
                {...register("username", { required: "Username is required" })}
                ref={(element) => {
                  // Need to do both
                  register("username").ref(element);
                  usernameInputRef.current = element;
                }}
              />
              {errors.username && (
                <p className="text-xs text-red-500">
                  {errors.username.message}
                </p>
              )}
            </motion.div>

            <div className="flex flex-col gap-2.5 mt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Button
                  type="submit"
                  className="w-full px-4 py-1.5 bg-primary text-primary-foreground rounded-full font-medium text-xs cursor-pointer duration-500 flex items-center justify-center"
                  disabled={isJoining || isCreating}
                >
                  <LogIn size={14} className="mr-1.5" />
                  <span>Join room</span>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.35 }}
              >
                <Button
                  type="button"
                  onClick={handleCreateRoom}
                  className="w-full px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full font-medium text-xs cursor-pointer duration-500 flex items-center justify-center"
                  disabled={isJoining || isCreating}
                >
                  <PlusCircle size={14} className="mr-1.5" />
                  <span>Create room</span>
                </Button>
              </motion.div>
            </div>
          </form>

          <motion.p
            className="text-neutral-500 mt-4 text-center text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            For best experience, use a laptop with Chrome browser. Only use the
            native device speakers, and make sure silent mode is off.
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
};
