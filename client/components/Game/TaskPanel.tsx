interface TaskPanelProps {
  role: "civilian" | "impostor";
  tasks: Array<{ id: string; description: string; completed: boolean }>;
  tests?: Array<{
    name: string;
    passed: boolean;
    output?: string;
    error?: string;
  }>;
  isTesting?: boolean;
  onRunTests?: () => void;
}

export default function TaskPanel({
  role,
  tasks,
  tests = [],
  isTesting = false,
  onRunTests,
}: TaskPanelProps) {
  const isImpostor = role === "impostor";
  const title = isImpostor ? "SABOTAGE TASKS" : "TEST CASES";
  const headerColor = isImpostor ? "bg-[#ff4757]" : "bg-[#4cd137]";

  return (
    <div className="w-64 bg-[#F5DEB3] border-r-4 border-black flex flex-col h-full font-mono">
      <div
        className={`${headerColor} text-white p-3 border-b-4 border-black font-bold text-center`}>
        {title}
      </div>

      <div className="p-4 flex flex-col gap-3 overflow-y-auto">
        {isImpostor &&
          tasks.map((task) => (
            <div
              key={task.id}
              className={`
                p-3 border-2 border-black bg-white shadow-[2px_2px_0_rgba(0,0,0,0.5)]
                ${task.completed ? "opacity-50" : ""}
              `}>
              <div className="flex items-start gap-2">
                <div
                  className={`mt-1 w-3 h-3 border-2 border-black ${
                    task.completed ? "bg-green-500" : "bg-white"
                  }`}
                />
                <p className="text-sm font-bold leading-tight text-black">
                  {task.description}
                </p>
              </div>
            </div>
          ))}

        {!isImpostor &&
          tests.map((test) => (
            <div
              key={test.name}
              className={`
                p-3 border-2 border-black bg-white shadow-[2px_2px_0_rgba(0,0,0,0.5)]
                ${test.passed ? "opacity-60" : ""}
              `}>
              <div className="flex items-start gap-2">
                <div
                  className={`mt-1 w-3 h-3 border-2 border-black ${
                    test.passed ? "bg-green-500" : "bg-white"
                  }`}
                />
                <p className="text-sm font-bold leading-tight text-black">
                  {test.name}
                </p>
              </div>
              {(test.output || test.error) && (
                <div className="mt-2 text-xs text-black/80">
                  {test.output && (
                    <div>
                      <span className="font-bold">Output:</span> {test.output}
                    </div>
                  )}
                  {test.error && (
                    <div className="text-red-600">
                      <span className="font-bold">Error:</span> {test.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

        {isImpostor && tasks.length === 0 && (
          <div className="text-center text-black/50 italic text-sm mt-4">
            No tasks assigned yet...
          </div>
        )}

        {!isImpostor && tests.length === 0 && (
          <div className="text-center text-black/50 italic text-sm mt-4">
            Run tests to see results...
          </div>
        )}
      </div>

      {!isImpostor && (
        <div className="p-4 border-t-4 border-black bg-white/70">
          <button
            onClick={onRunTests}
            disabled={isTesting}
            className="w-full bg-[#4cd137] hover:bg-[#44bd32] disabled:bg-gray-400 text-white font-bold py-2 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all">
            {isTesting ? "RUNNING..." : "RUN TESTS"}
          </button>
        </div>
      )}
    </div>
  );
}
