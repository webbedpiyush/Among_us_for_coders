import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

interface Message {
  id: string;
  sender: string;
  text: string;
  color: string;
  isSystem?: boolean;
}

interface ChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  currentPlayerName: string;
}

export default function Chat({ messages, onSendMessage, currentPlayerName }: ChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="w-80 bg-[#F5DEB3] border-l-4 border-black flex flex-col h-full font-mono">
      <div className="bg-[#4169E1] text-white p-3 border-b-4 border-black font-bold text-center flex items-center justify-center gap-2">
        <Icon icon="lucide:message-square" />
        CHAT
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`
              flex flex-col
              ${msg.isSystem ? "items-center my-2" : "items-start"}
            `}
          >
            {msg.isSystem ? (
              <span className="text-xs text-gray-600 italic bg-black/5 px-2 py-1 rounded">
                {msg.text}
              </span>
            ) : (
              <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0_rgba(0,0,0,0.3)] max-w-full break-words">
                <span className={`font-bold text-xs ${msg.color} block mb-1`}>
                  {msg.sender}
                </span>
                <span className="text-sm text-black">{msg.text}</span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t-4 border-black bg-white/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type message..."
            className="flex-1 bg-white border-2 border-black p-2 text-sm focus:outline-none focus:border-[#4169E1] text-black"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="bg-[#4169E1] text-white p-2 border-2 border-black hover:bg-[#3742fa] disabled:opacity-50 active:translate-y-0.5 active:shadow-none transition-all shadow-[2px_2px_0_rgba(0,0,0,1)]"
          >
            <Icon icon="lucide:send" />
          </button>
        </div>
      </form>
    </div>
  );
}
