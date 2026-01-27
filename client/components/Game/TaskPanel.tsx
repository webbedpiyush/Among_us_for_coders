interface TaskPanelProps {
  role: "civilian" | "impostor";
  tasks: Array<{ id: string; description: string; completed: boolean }>;
}

export default function TaskPanel({ role, tasks }: TaskPanelProps) {
  const isImpostor = role === "impostor";
  const title = isImpostor ? "SABOTAGE TASKS" : "TEST CASES";
  const headerColor = isImpostor ? "bg-[#ff4757]" : "bg-[#4cd137]";

  return (
    <div className="w-64 bg-[#F5DEB3] border-r-4 border-black flex flex-col h-full font-mono">
      <div className={`${headerColor} text-white p-3 border-b-4 border-black font-bold text-center`}>
        {title}
      </div>
      
      <div className="p-4 flex flex-col gap-3 overflow-y-auto">
        {tasks.map((task) => (
          <div 
            key={task.id}
            className={`
              p-3 border-2 border-black bg-white shadow-[2px_2px_0_rgba(0,0,0,0.5)]
              ${task.completed ? "opacity-50" : ""}
            `}
          >
            <div className="flex items-start gap-2">
              <div className={`mt-1 w-3 h-3 border-2 border-black ${task.completed ? "bg-green-500" : "bg-white"}`} />
              <p className="text-sm font-bold leading-tight text-black">{task.description}</p>
            </div>
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center text-black/50 italic text-sm mt-4">
            No tasks assigned yet...
          </div>
        )}
      </div>
    </div>
  );
}
