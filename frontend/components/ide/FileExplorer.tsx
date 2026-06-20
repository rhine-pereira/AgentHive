"use client";

/**
 * FileExplorer — Sidebar file tree with templates quick-add.
 */

import { useState } from "react";
import {
  FileCode,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Layout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileTab } from "./EditorTabs";

const TEMPLATES: Array<{ name: string; label: string; language: FileTab["language"]; content: string }> = [
  {
    name: "ERC20Token.sol",
    label: "ERC-20 Token",
    language: "solidity",
    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract ERC20Token is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    constructor(string memory _name, string memory _symbol, uint256 initialSupply) {
        name = _name;
        symbol = _symbol;
        _mint(msg.sender, initialSupply * 10 ** decimals);
    }

    function totalSupply() public view returns (uint256) { return _totalSupply; }
    function balanceOf(address account) public view returns (uint256) { return _balances[account]; }

    function transfer(address to, uint256 amount) public returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "ERC20: insufficient allowance");
        unchecked { _allowances[from][msg.sender] = currentAllowance - amount; }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0) && to != address(0), "ERC20: zero address");
        require(_balances[from] >= amount, "ERC20: insufficient balance");
        unchecked {
            _balances[from] -= amount;
            _balances[to] += amount;
        }
        emit Transfer(from, to, amount);
    }

    function _mint(address account, uint256 amount) internal {
        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);
    }
}`,
  },
  {
    name: "ERC721NFT.sol",
    label: "ERC-721 NFT",
    language: "solidity",
    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ERC721NFT {
    string public name;
    string public symbol;
    uint256 private _nextTokenId;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(uint256 => string) private _tokenURIs;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address to, string memory uri) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _owners[tokenId] = to;
        _balances[to]++;
        _tokenURIs[tokenId] = uri;
        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: invalid token");
        return owner;
    }

    function balanceOf(address owner) public view returns (uint256) {
        return _balances[owner];
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(ownerOf(tokenId) == from, "ERC721: not owner");
        require(msg.sender == from || msg.sender == _tokenApprovals[tokenId], "ERC721: not approved");
        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;
        delete _tokenApprovals[tokenId];
        emit Transfer(from, to, tokenId);
    }
}`,
  },
];

function detectLanguage(filename: string): FileTab["language"] {
  if (filename.endsWith(".sol")) return "solidity";
  if (filename.endsWith(".rs")) return "rust";
  if (filename.endsWith(".js") || filename.endsWith(".ts")) return "javascript";
  if (filename.endsWith(".json")) return "json";
  return "text";
}

interface Props {
  files: FileTab[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: (file: Omit<FileTab, "id" | "isDirty">) => void;
  onDelete: (id: string) => void;
}

export function FileExplorer({ files, activeId, onSelect, onAdd, onDelete }: Props) {
  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [contextId, setContextId] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(true);

  function handleCreate() {
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    onAdd({ name, content: "", language: detectLanguage(name) });
    setNewFileName("");
    setCreatingFile(false);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Explorer
        </span>
        <button
          onClick={() => setCreatingFile(true)}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-white/8 transition-colors"
          aria-label="New file"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Files */}
      <div className="flex-1 overflow-y-auto py-1">
        <div className="px-2 py-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-1">
            Files
          </span>
        </div>

        {/* New file input */}
        {creatingFile && (
          <div className="px-2 pb-1">
            <input
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setCreatingFile(false);
              }}
              onBlur={handleCreate}
              placeholder="filename.sol"
              className="w-full rounded border border-primary/60 bg-primary/10 px-2 py-1 text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
            />
          </div>
        )}

        {files.map((file) => (
          <div
            key={file.id}
            className="relative"
            onContextMenu={(e) => {
              e.preventDefault();
              setContextId(contextId === file.id ? null : file.id);
            }}
          >
            <button
              onClick={() => {
                onSelect(file.id);
                setContextId(null);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors",
                file.id === activeId
                  ? "bg-primary/12 text-foreground"
                  : "text-muted-foreground hover:bg-white/4 hover:text-foreground",
              )}
            >
              <FileCode size={13} className="shrink-0" />
              <span className="truncate">{file.name}</span>
              {file.isDirty && (
                <span className="ml-auto size-1.5 rounded-full bg-yellow-400 shrink-0" />
              )}
            </button>

            {contextId === file.id && (
              <div className="absolute left-8 top-full z-50 w-36 rounded-lg border border-border bg-card shadow-xl py-1 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  onClick={() => {
                    onDelete(file.id);
                    setContextId(null);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={12} />
                  Delete file
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Templates */}
        <div className="mt-3 px-2">
          <button
            onClick={() => setTemplatesOpen((v) => !v)}
            className="flex items-center gap-1 w-full px-1 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
          >
            {templatesOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            Templates
          </button>

          {templatesOpen && (
            <div className="mt-1 flex flex-col gap-0.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => onAdd({ name: t.name, content: t.content, language: t.language })}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-muted-foreground hover:bg-white/4 hover:text-foreground transition-colors"
                >
                  <Layout size={12} className="shrink-0 text-primary/70" />
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
