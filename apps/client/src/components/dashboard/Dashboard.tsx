import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGlobalStore } from "@/store/global";
import { AnimatePresence, motion } from "framer-motion";
import { Library, ListMusic, Loader, Rotate3D } from "lucide-react";
import { TopBar } from "../room/TopBar";
import { Bottom } from "./Bottom";
import { Left } from "./Left";
import { Main } from "./Main";
import { Right } from "./Right";

export const Dashboard = () => {
  const isSynced = useGlobalStore((state) => state.isSynced);
  const isLoadingAudio = useGlobalStore((state) => state.isLoadingAudio);

  const isReady = isSynced && !isLoadingAudio;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="w-full h-screen flex flex-col text-white bg-neutral-950">
      {/* Top bar: Fixed height */}
      <TopBar />

      {!isReady && (
        <motion.div
          className="flex-1 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            animate={{
              rotate: 360,
              transition: { repeat: Infinity, duration: 1.5, ease: "linear" },
            }}
            className="mb-3"
          >
            <Loader className="h-10 w-10 text-primary/60" />
          </motion.div>
          <p className="text-neutral-400 text-sm">Connecting to room...</p>
        </motion.div>
      )}

      {isReady && (
        <motion.div
          className="flex flex-1 flex-col overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* --- DESKTOP LAYOUT (md+) --- */}
          <div className="hidden md:flex md:flex-1 md:overflow-hidden">
            <Left className="flex" />
            <Main />
            <Right className="flex md:w-80 md:flex-shrink-0" />
          </div>

          {/* --- MOBILE LAYOUT (< md) --- */}
          <div className="flex flex-1 flex-col md:hidden">
            <Tabs
              defaultValue="queue"
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Tab List at the top for mobile */}
              <TabsList className="shrink-0 grid w-full grid-cols-3 h-12 rounded-none border-b border-neutral-800/50 p-0 bg-neutral-950">
                <TabsTrigger
                  value="library"
                  className="flex-1 data-[state=active]:bg-white/5 data-[state=active]:shadow-none rounded-none text-xs h-full gap-1 text-neutral-400 data-[state=active]:text-white transition-all duration-200"
                >
                  <Library size={16} /> Library
                </TabsTrigger>
                <TabsTrigger
                  value="queue"
                  className="flex-1 data-[state=active]:bg-white/5 data-[state=active]:shadow-none rounded-none text-xs h-full gap-1 text-neutral-400 data-[state=active]:text-white transition-all duration-200"
                >
                  <ListMusic size={16} /> Queue
                </TabsTrigger>
                <TabsTrigger
                  value="spatial"
                  className="flex-1 data-[state=active]:bg-white/5 data-[state=active]:shadow-none rounded-none text-xs h-full gap-1 text-neutral-400 data-[state=active]:text-white transition-all duration-200"
                >
                  <Rotate3D size={16} /> Spatial
                </TabsTrigger>
              </TabsList>

              {/* Tab Content Area - Scrolls independently */}
              <AnimatePresence mode="wait">
                <TabsContent
                  key="library"
                  value="library"
                  className="flex-1 overflow-y-auto mt-0"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <Left className="flex h-full w-full" />
                  </motion.div>
                </TabsContent>
                <TabsContent
                  key="queue"
                  value="queue"
                  className="flex-1 overflow-y-auto mt-0"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <Main />
                  </motion.div>
                </TabsContent>
                <TabsContent
                  key="spatial"
                  value="spatial"
                  className="flex-1 overflow-y-auto mt-0"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <Right className="flex h-full w-full" />
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </div>

          {/* Bottom Player: Fixed height, outside the scrollable/tab area */}
          <Bottom />
        </motion.div>
      )}
    </div>
  );
};
