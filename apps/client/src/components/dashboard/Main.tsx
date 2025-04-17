import { motion } from "framer-motion";
import { Queue } from "../Queue";

export const Main = () => {
  return (
    <motion.div className="w-full lg:flex-1 overflow-y-auto bg-gradient-to-b from-neutral-900/50 to-neutral-950 backdrop-blur-xl">
      <motion.div className="p-6 pt-4">
        {/* <h1 className="text-xl font-semibold mb-8">BeatSync</h1> */}
        <Queue className="mb-8" />
      </motion.div>
    </motion.div>
  );
};
