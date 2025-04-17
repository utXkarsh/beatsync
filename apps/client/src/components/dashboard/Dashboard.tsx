import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGlobalStore } from "@/store/global";
import { motion } from "framer-motion";
import { Library, ListMusic, Users } from "lucide-react";
import { TopBar } from "../room/TopBar";
import { Bottom } from "./Bottom";
import { Left } from "./Left";
import { Main } from "./Main";
import { Right } from "./Right";

export const Dashboard = () => {
  const isSynced = useGlobalStore((state) => state.isSynced);
  const isLoadingAudio = useGlobalStore((state) => state.isLoadingAudio);

  const isReady = isSynced && !isLoadingAudio;

  return (
    <div className="w-full h-screen flex flex-col text-white bg-neutral-950">
      {/* Top bar: Fixed height */}
      <TopBar />

      {isReady && (
        <motion.div
          className="flex flex-1 flex-col overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* --- DESKTOP LAYOUT (md+) --- */}
          <div className="hidden md:flex md:flex-1 md:overflow-hidden">
            <Left className="flex" />
            <Main />
            {/* Use specific desktop classes if needed */}
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
                  className="flex-1 data-[state=active]:bg-white/5 data-[state=active]:shadow-none rounded-none text-xs h-full gap-1 text-neutral-400 data-[state=active]:text-white"
                >
                  <Library size={16} /> Library
                </TabsTrigger>
                <TabsTrigger
                  value="queue"
                  className="flex-1 data-[state=active]:bg-white/5 data-[state=active]:shadow-none rounded-none text-xs h-full gap-1 text-neutral-400 data-[state=active]:text-white"
                >
                  <ListMusic size={16} /> Queue
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="flex-1 data-[state=active]:bg-white/5 data-[state=active]:shadow-none rounded-none text-xs h-full gap-1 text-neutral-400 data-[state=active]:text-white"
                >
                  <Users size={16} /> Users
                </TabsTrigger>
              </TabsList>

              {/* Tab Content Area - Scrolls independently */}
              <TabsContent value="library" className="flex-1 overflow-y-auto">
                {/* Remove fixed width/height from component instance if needed */}
                <Left className="flex h-full w-full" />
              </TabsContent>
              <TabsContent value="queue" className="flex-1 overflow-y-auto">
                <Main />
              </TabsContent>
              <TabsContent value="users" className="flex-1 overflow-y-auto">
                {/* Remove fixed width/height from component instance if needed */}
                <Right className="flex h-full w-full" />
              </TabsContent>
            </Tabs>
          </div>

          {/* Bottom Player: Fixed height, outside the scrollable/tab area */}
          <Bottom />
        </motion.div>
      )}
    </div>
  );
};
