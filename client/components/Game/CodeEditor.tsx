import Editor, { OnMount } from "@monaco-editor/react";
import { useRef } from "react";

interface CodeEditorProps {
  initialCode: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
}

export default function CodeEditor({ initialCode, language, onChange, readOnly = false }: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Define custom theme matching our pixel art style
    monaco.editor.defineTheme('retro-theme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.lineHighlightBackground': '#F0F0F0',
        'editorLineNumber.foreground': '#000000',
      }
    });
    
    monaco.editor.setTheme('retro-theme');
  };

  return (
    <div className="h-full w-full border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,0.5)] bg-white overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage={language === "python" ? "python" : "javascript"}
        defaultValue={initialCode}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'Courier New', monospace",
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
}
