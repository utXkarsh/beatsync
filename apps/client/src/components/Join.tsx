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
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

interface JoinFormData {
  roomId: string;
  username: string;
}

export const Join = () => {
  const [isJoining, setIsJoining] = useState(false);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const setRoomId = useRoomStore((state) => state.setRoomId);
  const setUsername = useRoomStore((state) => state.setUsername);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<JoinFormData>({
    defaultValues: {
      roomId: "",
      username: "",
    },
  });

  const router = useRouter();

  const onSubmit = (data: JoinFormData) => {
    setIsJoining(true);
    // Validate roomId
    if (!validateFullRoomId(data.roomId)) {
      alert("Invalid room ID");
      return;
    }

    console.log("Joining room with data:", data);
    setRoomId(data.roomId);
    setUsername(data.username);
    router.push(`/room/${data.roomId}`);
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-neutral-950 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-md px-1">
        <motion.div
          className="flex flex-col items-center justify-center p-6 bg-neutral-900 rounded-md border border-neutral-800 shadow-lg"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <motion.h2
            className="text-base font-medium tracking-tight mb-1 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            Join a Beatsync Room
          </motion.h2>

          <motion.p
            className="text-neutral-400 mb-5 text-center text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            Enter a room code and choose a username
          </motion.p>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <label className="text-xs text-neutral-400">Room Code</label>
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
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
              {errors.roomId && (
                <p className="text-xs text-red-500">{errors.roomId.message}</p>
              )}
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <label className="text-xs text-neutral-400">Username</label>
              <Input
                className="bg-neutral-800 border-neutral-700 focus:border-neutral-600"
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

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Button
                type="submit"
                className="w-full mt-4 px-5 py-2 bg-primary text-primary-foreground rounded-full font-medium text-xs tracking-wide cursor-pointer duration-500"
                disabled={isJoining}
              >
                {isJoining ? "Joining..." : "Join Room"}
              </Button>
            </motion.div>
          </form>

          <motion.p
            className="text-neutral-500 mt-5 text-center text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            For best experience, use a laptop with Chrome browser. Only use the
            native device speakers, and make sure silent mode is off.
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
};
