"use client";

/**
 * MonacoEditor — Dynamic-imported Monaco editor with Solidity tokenizer.
 * SSR is disabled; loaded client-side only.
 */

import dynamic from "next/dynamic";
import { useCallback } from "react";
import type { editor as MonacoEditorType } from "monaco-editor";

const MonacoEditorBase = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false, loading: () => <EditorSkeleton /> },
);

function EditorSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#05050f]">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs text-muted-foreground">Loading editor…</span>
      </div>
    </div>
  );
}

type MonacoModule = typeof import("monaco-editor");

function registerSolidity(monaco: MonacoModule) {
  if (monaco.languages.getLanguages().some((l: { id: string }) => l.id === "solidity")) return;

  monaco.languages.register({ id: "solidity" });
  monaco.languages.setMonarchTokensProvider("solidity", {
    keywords: [
      "pragma", "solidity", "contract", "interface", "library", "is",
      "function", "modifier", "event", "constructor", "fallback", "receive",
      "public", "private", "internal", "external", "pure", "view", "payable",
      "virtual", "override", "abstract", "returns", "return",
      "if", "else", "for", "while", "do", "break", "continue",
      "new", "delete", "emit", "revert", "require", "assert",
      "mapping", "address", "bool", "string", "bytes", "uint", "int",
      "uint8", "uint256", "int256", "bytes32",
      "storage", "memory", "calldata",
      "immutable", "constant",
      "true", "false",
    ],
    operators: ["=", ">", "<", "!", "~", "?", ":", "==", "<=", ">=", "!=", "&&", "||", "++", "--", "+", "-", "*", "/", "&", "|", "^", "%", "<<", ">>", ">>>", "+=", "-=", "*=", "/=", "&=", "|=", "^=", "%=", "<<=", ">>=", ">>>="],
    tokenizer: {
      root: [
        [/\/\/.*$/, "comment"],
        [/\/\*/, "comment", "@comment"],
        [/"([^"\\]|\\.)*$/, "string.invalid"],
        [/"/, "string", "@string"],
        [/0x[0-9a-fA-F]+/, "number.hex"],
        [/\d+(\.\d+)?/, "number"],
        [/[{}()\[\]]/, "@brackets"],
        [
          /[a-zA-Z_$][\w$]*/,
          {
            cases: {
              "@keywords": "keyword",
              "@default": "identifier",
            },
          },
        ],
        [/[;,.]/, "delimiter"],
      ],
      comment: [
        [/[^/*]+/, "comment"],
        [/\*\//, "comment", "@pop"],
        [/[/*]/, "comment"],
      ],
      string: [
        [/[^\\"]+/, "string"],
        [/\\./, "string.escape"],
        [/"/, "string", "@pop"],
      ],
    },
  });
}

interface Props {
  value: string;
  language: string;
  onChange: (val: string) => void;
}

export function MonacoEditor({ value, language, onChange }: Props) {
  const handleMount = useCallback(
    (_editor: MonacoEditorType.IStandaloneCodeEditor, monaco: MonacoModule) => {
      registerSolidity(monaco);
    },
    [],
  );

  return (
    <MonacoEditorBase
      height="100%"
      language={language}
      value={value}
      theme="vs-dark"
      onChange={(v) => onChange(v ?? "")}
      onMount={handleMount}
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        bracketPairColorization: { enabled: true },
        smoothScrolling: true,
        cursorBlinking: "smooth",
        padding: { top: 12 },
        lineNumbersMinChars: 3,
        renderLineHighlight: "all",
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
      }}
    />
  );
}
