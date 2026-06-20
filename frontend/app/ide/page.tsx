"use client";

/**
 * /ide — AgentHive Multi-Chain Smart Contract IDE
 *
 * Full workspace: file explorer | Monaco editor | compile/deploy panels | terminal
 */

import { useState, useCallback, useRef } from "react";
import { IdeNavbar } from "@/components/ide/IdeNavbar";
import { FileExplorer } from "@/components/ide/FileExplorer";
import { EditorTabs, type FileTab } from "@/components/ide/EditorTabs";
import { MonacoEditor } from "@/components/ide/MonacoEditor";
import { CompilePanel, type CompiledContract } from "@/components/ide/CompilePanel";
import { DeployPanel } from "@/components/ide/DeployPanel";
import { Terminal, type TerminalLine } from "@/components/ide/Terminal";
import type { ChainKey } from "@/lib/wagmi-config";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://agent-hive-ld3l.onrender.com";

const DEFAULT_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HelloWorld
 * @dev A simple storage contract to get started.
 */
contract HelloWorld {
    string private _message;

    constructor(string memory initialMessage) {
        _message = initialMessage;
    }

    function getMessage() public view returns (string memory) {
        return _message;
    }

    function setMessage(string calldata newMessage) public {
        _message = newMessage;
    }
}
`;

let _tabCounter = 1;
function makeId() { return `tab-${_tabCounter++}`; }

function makeDefaultTab(): FileTab {
  return {
    id: makeId(),
    name: "HelloWorld.sol",
    content: DEFAULT_CONTRACT,
    language: "solidity",
    isDirty: false,
  };
}

export default function IdePage() {
  const [files, setFiles] = useState<FileTab[]>([makeDefaultTab()]);
  const [activeId, setActiveId] = useState(files[0].id);
  const [selectedChain, setSelectedChain] = useState<ChainKey>("sepolia");
  const [projectName, setProjectName] = useState("Untitled Project");
  const [rightTab, setRightTab] = useState<"compile" | "deploy">("compile");
  const [compiledContracts, setCompiledContracts] = useState<CompiledContract[]>([]);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Bottom panel resize
  const [terminalH, setTerminalH] = useState(200);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  const activeFile = files.find((f) => f.id === activeId) ?? files[0];

  function addLine(line: TerminalLine) {
    setTerminalLines((prev) => [...prev, { ...line, timestamp: new Date().toLocaleTimeString() }]);
  }

  // ── File operations ──────────────────────────────────────────────────────
  function handleEditorChange(value: string) {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeId ? { ...f, content: value, isDirty: true } : f,
      ),
    );
  }

  function handleAddFile(file: Omit<FileTab, "id" | "isDirty">) {
    const id = makeId();
    setFiles((prev) => [...prev, { ...file, id, isDirty: false }]);
    setActiveId(id);
  }

  function handleCloseTab(id: string) {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (next.length === 0) {
        const def = makeDefaultTab();
        setActiveId(def.id);
        return [def];
      }
      if (activeId === id) setActiveId(next[next.length - 1].id);
      return next;
    });
  }

  function handleDeleteFile(id: string) {
    handleCloseTab(id);
  }

  // ── Save project ─────────────────────────────────────────────────────────
  async function handleSave() {
    setIsSaving(true);
    addLine({ type: "command", text: `Saving "${projectName}"…` });
    try {
      const body = {
        name: projectName,
        chain: selectedChain,
        language: activeFile?.language ?? "solidity",
        user_wallet: "0x0000000000000000000000000000000000000000",
        files: files.map((f) => ({
          name: f.name,
          content: f.content,
          language: f.language,
        })),
      };
      const res = await fetch(`${BACKEND_URL}/api/ide/projects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setFiles((prev) => prev.map((f) => ({ ...f, isDirty: false })));
        addLine({ type: "success", text: "Project saved." });
      } else {
        addLine({ type: "warning", text: "Saved locally (backend unavailable)." });
      }
    } catch {
      addLine({ type: "warning", text: "Backend offline — project not saved to cloud." });
    } finally {
      setIsSaving(false);
    }
  }

  // ── Resize handle ────────────────────────────────────────────────────────
  function onResizeStart(e: React.MouseEvent) {
    dragging.current = true;
    startY.current = e.clientY;
    startH.current = terminalH;
    document.addEventListener("mousemove", onResizeMove);
    document.addEventListener("mouseup", onResizeEnd);
  }

  function onResizeMove(e: MouseEvent) {
    if (!dragging.current) return;
    const delta = startY.current - e.clientY;
    setTerminalH(Math.max(80, Math.min(500, startH.current + delta)));
  }

  function onResizeEnd() {
    dragging.current = false;
    document.removeEventListener("mousemove", onResizeMove);
    document.removeEventListener("mouseup", onResizeEnd);
  }

  return (
    <div className="ide-root flex flex-col h-screen bg-[#05050f] text-foreground overflow-hidden">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <IdeNavbar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        selectedChain={selectedChain}
        onChainChange={setSelectedChain}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* ── Main workspace ─────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── File Explorer Sidebar ─── */}
        <aside className="hidden md:flex flex-col w-52 border-r border-white/8 bg-[#07070e] shrink-0">
          <FileExplorer
            files={files}
            activeId={activeId}
            onSelect={setActiveId}
            onAdd={handleAddFile}
            onDelete={handleDeleteFile}
          />
        </aside>

        {/* ── Center: Editor + Terminal ─── */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          {/* Tabs */}
          <EditorTabs
            tabs={files}
            activeId={activeId}
            onSelect={setActiveId}
            onClose={handleCloseTab}
          />

          {/* Editor */}
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            {activeFile ? (
              <MonacoEditor
                key={activeFile.id}
                value={activeFile.content}
                language={activeFile.language}
                onChange={handleEditorChange}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No file open
              </div>
            )}
          </div>

          {/* Resize handle */}
          <div
            onMouseDown={onResizeStart}
            className="h-1 cursor-row-resize bg-white/5 hover:bg-primary/40 transition-colors shrink-0"
          />

          {/* Terminal */}
          <div
            className="shrink-0 border-t border-white/8 bg-[#07070e]"
            style={{ height: terminalH }}
          >
            <Terminal
              lines={terminalLines}
              onClear={() => setTerminalLines([])}
            />
          </div>
        </div>

        {/* ── Right Panel: Compile / Deploy ─── */}
        <aside className="hidden lg:flex flex-col w-72 border-l border-white/8 bg-[#07070e] shrink-0">
          {/* Tab switcher */}
          <div className="flex border-b border-white/8 shrink-0">
            {(["compile", "deploy"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
                  rightTab === tab
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {rightTab === "compile" ? (
              <CompilePanel
                sourceCode={activeFile?.content ?? ""}
                selectedChain={selectedChain}
                onCompiled={setCompiledContracts}
                onTerminalLine={addLine}
                onSwitchToDeployTab={() => setRightTab("deploy")}
              />
            ) : (
              <DeployPanel
                compiledContracts={compiledContracts}
                selectedChain={selectedChain}
                onTerminalLine={addLine}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
