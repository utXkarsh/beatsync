export const Dashboard = () => {
  return (
    <div className="w-full h-full">
      <div className="flex flex-col md:flex-row gap-4 p-4 h-full">
        {/* Left column */}
        <div className="flex-shrink-0 md:w-sm bg-neutral-900 rounded-lg p-4 shadow-md h-full">
          <h2 className="text-lg font-medium mb-4">Your Library</h2>
          <div className="text-sm text-neutral-400">
            Navigation content here
          </div>
        </div>

        {/* Middle column - larger */}
        <div className="flex-grow md:w-1/2 bg-neutral-900 rounded-lg p-4 shadow-md">
          <h2 className="text-lg font-medium mb-4">Main Content</h2>
          <div className="text-sm text-neutral-400">
            This is the main content area. It takes up more space than the side
            panels.
          </div>
        </div>

        {/* Right column */}
        <div className="flex-shrink-0 md:w-1/4 bg-neutral-900 rounded-lg p-4 shadow-md">
          <h2 className="text-lg font-medium mb-4">Right Panel</h2>
          <div className="text-sm text-neutral-400">
            Additional information here
          </div>
        </div>
      </div>
    </div>
  );
};
