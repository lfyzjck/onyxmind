import { type ReactNode, useState } from "react";
import type OnyxMindPlugin from "../../main";
import {
  type ModelConfig,
  type OnyxMindSettings,
  type PermissionConfig,
  type ProviderConfig,
  type ProviderId,
  PROVIDER_META,
} from "../../settings";

// ── Primitive controls ────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="onyxmind-sp-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="onyxmind-sp-toggle-track">
        <span className="onyxmind-sp-toggle-thumb" />
      </span>
    </label>
  );
}

function SettingRow({
  name,
  desc,
  children,
}: {
  name: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <div className="onyxmind-sp-row">
      <div className="onyxmind-sp-row-info">
        <div className="onyxmind-sp-row-name">{name}</div>
        {desc && <div className="onyxmind-sp-row-desc">{desc}</div>}
      </div>
      <div className="onyxmind-sp-row-ctrl">{children}</div>
    </div>
  );
}

// ── Provider tab ──────────────────────────────────────────────────────────

const PROVIDER_IDS: ProviderId[] = [
  "openai",
  "anthropic",
  "kimi",
  "kimi-for-coding",
  "openrouter",
];

function ProviderTab({ plugin }: { plugin: OnyxMindPlugin }) {
  const [selectedId, setSelectedId] = useState<ProviderId>("openai");
  const [providers, setProviders] = useState<ProviderConfig[]>(() => {
    const existing = plugin.settings.providers ?? [];

    // Ensure we always have a provider config for every known provider ID.
    const merged: ProviderConfig[] = PROVIDER_IDS.map((id) => {
      const found = existing.find((p) => p.id === id);
      if (found) return found;

      return {
        id,
        apiKey: "",
        apiBase: "",
        models: PROVIDER_META[id].defaultModels,
      };
    });

    plugin.settings.providers = merged;
    return merged;
  });
  const [activeProviderId, setActiveProviderId] = useState<ProviderId>(
    () => plugin.settings.activeProviderId,
  );
  const [activeModelId, setActiveModelId] = useState<string>(
    () => plugin.settings.activeModelId,
  );

  const getProvider = (id: ProviderId) =>
    providers.find((p) => p.id === id) ??
    plugin.settings.providers.find((p) => p.id === id)!;

  const saveProviders = async (next: ProviderConfig[]) => {
    setProviders(next);
    plugin.settings.providers = next;
    await plugin.saveSettings();
  };

  const updateProvider = async (
    id: ProviderId,
    updates: Partial<Omit<ProviderConfig, "id">>,
  ) => {
    await saveProviders(
      providers.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  };

  const updateModel = async (
    pid: ProviderId,
    idx: number,
    updates: Partial<ModelConfig>,
  ) => {
    const p = getProvider(pid);
    await updateProvider(pid, {
      models: p.models.map((m, i) => (i === idx ? { ...m, ...updates } : m)),
    });
  };

  const addModel = async (pid: ProviderId) => {
    const p = getProvider(pid);
    await updateProvider(pid, {
      models: [
        ...p.models,
        { modelId: "", maxTokens: 128000, isReasoning: false },
      ],
    });
  };

  const removeModel = async (pid: ProviderId, idx: number) => {
    const p = getProvider(pid);
    await updateProvider(pid, {
      models: p.models.filter((_, i) => i !== idx),
    });
  };

  const updateActiveModel = async (pid: ProviderId, mid: string) => {
    setActiveProviderId(pid);
    setActiveModelId(mid);
    plugin.settings.activeProviderId = pid;
    plugin.settings.activeModelId = mid;
    await plugin.saveSettings();
  };

  const current = getProvider(selectedId);
  const meta = PROVIDER_META[selectedId];
  const activeProvider = providers.find((p) => p.id === activeProviderId);

  return (
    <>
      {/* Two-column layout */}
      <div className="onyxmind-sp-provider-layout">
        {/* Left sidebar */}
        <nav className="onyxmind-sp-sidebar" aria-label="Providers">
          {PROVIDER_IDS.map((id) => {
            const p = getProvider(id);
            const isSelected = selectedId === id;
            const isActive = activeProviderId === id;
            const hasKey = p.apiKey.trim().length > 0;
            return (
              <button
                key={id}
                className={`onyxmind-sp-provider-item${isSelected ? " is-selected" : ""}`}
                onClick={() => setSelectedId(id)}
              >
                <span className="onyxmind-sp-provider-name">
                  {PROVIDER_META[id].name}
                </span>
                <span
                  className={`onyxmind-sp-provider-dot${hasKey ? " has-key" : ""}${isActive ? " is-active" : ""}`}
                  title={
                    isActive ? "Active" : hasKey ? "Configured" : "No API key"
                  }
                />
              </button>
            );
          })}
        </nav>

        {/* Right config panel */}
        <div className="onyxmind-sp-config">
          <div className="onyxmind-sp-config-title">{meta.name}</div>

          <div className="onyxmind-sp-field">
            <label className="onyxmind-sp-field-label">API Key</label>
            <input
              type="password"
              className="onyxmind-sp-input"
              placeholder={`Enter ${meta.name} API key`}
              value={current.apiKey}
              onChange={(e) => {
                const v = e.target.value;
                void updateProvider(selectedId, { apiKey: v });
              }}
            />
          </div>

          {!meta.fixedApiBase && (
            <div className="onyxmind-sp-field">
              <label className="onyxmind-sp-field-label">API Base URL</label>
              <input
                type="text"
                className="onyxmind-sp-input"
                placeholder={meta.defaultApiBase}
                value={current.apiBase}
                onChange={(e) => {
                  const v = e.target.value;
                  void updateProvider(selectedId, { apiBase: v });
                }}
              />
            </div>
          )}

          {/* Models table */}
          <div className="onyxmind-sp-models-section">
            <div className="onyxmind-sp-models-head">
              <span className="onyxmind-sp-col-model">Model ID</span>
              <span className="onyxmind-sp-col-tokens">Max Tokens</span>
              <span className="onyxmind-sp-col-reas">Reasoning</span>
              <span className="onyxmind-sp-col-del" />
            </div>

            {current.models.map((model, idx) => (
              <div key={idx} className="onyxmind-sp-model-row">
                <input
                  type="text"
                  className="onyxmind-sp-input onyxmind-sp-col-model"
                  value={model.modelId}
                  placeholder="model-id"
                  onChange={(e) => {
                    const v = e.target.value;
                    void updateModel(selectedId, idx, { modelId: v });
                  }}
                />
                <input
                  type="number"
                  className="onyxmind-sp-input onyxmind-sp-col-tokens"
                  value={model.maxTokens}
                  min={1}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v > 0)
                      void updateModel(selectedId, idx, { maxTokens: v });
                  }}
                />
                <Toggle
                  checked={model.isReasoning}
                  onChange={(v) =>
                    void updateModel(selectedId, idx, { isReasoning: v })
                  }
                />
                <button
                  className="onyxmind-sp-remove-btn"
                  aria-label="Remove model"
                  onClick={() => void removeModel(selectedId, idx)}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              className="onyxmind-sp-add-btn"
              onClick={() => void addModel(selectedId)}
            >
              + Add Model
            </button>
          </div>
        </div>
      </div>

      {/* Active model — full width strip below two-column layout */}
      <div className="onyxmind-sp-active-model">
        <div className="onyxmind-sp-active-model-title">Active Model</div>
        <div className="onyxmind-sp-active-model-row">
          <div className="onyxmind-sp-active-field">
            <label className="onyxmind-sp-field-label">Provider</label>
            <select
              className="onyxmind-sp-select"
              value={activeProviderId}
              onChange={(e) => {
                const pid = e.target.value as ProviderId;
                const first =
                  providers.find((p) => p.id === pid)?.models[0]?.modelId ?? "";
                void updateActiveModel(pid, first);
              }}
            >
              {PROVIDER_IDS.map((id) => (
                <option key={id} value={id}>
                  {PROVIDER_META[id].name}
                </option>
              ))}
            </select>
          </div>
          <div className="onyxmind-sp-active-field">
            <label className="onyxmind-sp-field-label">Model</label>
            <select
              className="onyxmind-sp-select"
              value={activeModelId}
              onChange={(e) =>
                void updateActiveModel(activeProviderId, e.target.value)
              }
            >
              {(activeProvider?.models ?? []).map((m) => (
                <option key={m.modelId} value={m.modelId}>
                  {m.modelId}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Agent tab ─────────────────────────────────────────────────────────────

function AgentTab({ plugin }: { plugin: OnyxMindPlugin }) {
  const s = plugin.settings;

  const save = async (updates: Partial<OnyxMindSettings>) => {
    Object.assign(plugin.settings, updates);
    await plugin.saveSettings();
  };

  const [searchScope, setSearchScope] = useState(s.defaultSearchScope);
  const [autoSave, setAutoSave] = useState(s.autoSave);
  const [maxSessions, setMaxSessions] = useState(String(s.maxActiveSessions));
  const [confirmOps, setConfirmOps] = useState(s.confirmFileOperations);
  const [maxHistory, setMaxHistory] = useState(String(s.maxHistoryMessages));
  const [showTools, setShowTools] = useState(s.showToolCallsAfterStreaming);

  return (
    <div className="onyxmind-sp-rows">
      <SettingRow
        name="Default search scope"
        desc="Where to search for notes by default."
      >
        <select
          className="onyxmind-sp-select onyxmind-sp-select-sm"
          value={searchScope}
          onChange={(e) => {
            const v = e.target.value as "vault" | "current-folder";
            setSearchScope(v);
            void save({ defaultSearchScope: v });
          }}
        >
          <option value="vault">Entire vault</option>
          <option value="current-folder">Current folder</option>
        </select>
      </SettingRow>

      <SettingRow
        name="Auto-save conversations"
        desc="Automatically save conversation history."
      >
        <Toggle
          checked={autoSave}
          onChange={(v) => {
            setAutoSave(v);
            void save({ autoSave: v });
          }}
        />
      </SettingRow>

      <SettingRow
        name="Maximum active sessions"
        desc="Limit how many sessions can stay open at the same time."
      >
        <input
          type="number"
          className="onyxmind-sp-input onyxmind-sp-input-sm"
          value={maxSessions}
          min={1}
          onChange={(e) => {
            setMaxSessions(e.target.value);
            const n = parseInt(e.target.value);
            if (!isNaN(n) && n > 0) void save({ maxActiveSessions: n });
          }}
        />
      </SettingRow>

      <SettingRow
        name="Confirm file operations"
        desc="Ask for confirmation before AI modifies files."
      >
        <Toggle
          checked={confirmOps}
          onChange={(v) => {
            setConfirmOps(v);
            void save({ confirmFileOperations: v });
          }}
        />
      </SettingRow>

      <SettingRow
        name="Maximum history messages"
        desc="Maximum number of messages to keep in history."
      >
        <input
          type="number"
          className="onyxmind-sp-input onyxmind-sp-input-sm"
          value={maxHistory}
          min={1}
          onChange={(e) => {
            setMaxHistory(e.target.value);
            const n = parseInt(e.target.value);
            if (!isNaN(n) && n > 0) void save({ maxHistoryMessages: n });
          }}
        />
      </SettingRow>

      <SettingRow
        name="Show tool calls after streaming"
        desc="Keep tool call details visible after a response finishes streaming."
      >
        <Toggle
          checked={showTools}
          onChange={(v) => {
            setShowTools(v);
            void save({ showToolCallsAfterStreaming: v });
          }}
        />
      </SettingRow>
    </div>
  );
}

// ── Advanced tab ──────────────────────────────────────────────────────────

function AdvancedTab({ plugin }: { plugin: OnyxMindPlugin }) {
  const s = plugin.settings;

  const save = async (updates: Partial<OnyxMindSettings>) => {
    Object.assign(plugin.settings, updates);
    await plugin.saveSettings();
  };

  const [serviceUrl, setServiceUrl] = useState(s.opencodeBaseUrl);
  const [timeout, setTimeout_] = useState(String(s.timeout));
  const [retries, setRetries] = useState(String(s.maxRetries));
  const [stream, setStream] = useState(s.streamResponse);

  return (
    <div className="onyxmind-sp-rows">
      <SettingRow name="Service URL" desc="Base URL for the OpenCode service.">
        <input
          type="text"
          className="onyxmind-sp-input onyxmind-sp-input-md"
          value={serviceUrl}
          placeholder="http://localhost:4096"
          onChange={(e) => {
            setServiceUrl(e.target.value);
            void save({ opencodeBaseUrl: e.target.value });
          }}
        />
      </SettingRow>

      <SettingRow
        name="Request timeout"
        desc="Timeout for API requests in milliseconds."
      >
        <input
          type="number"
          className="onyxmind-sp-input onyxmind-sp-input-sm"
          value={timeout}
          min={1000}
          onChange={(e) => {
            setTimeout_(e.target.value);
            const n = parseInt(e.target.value);
            if (!isNaN(n) && n > 0) void save({ timeout: n });
          }}
        />
      </SettingRow>

      <SettingRow
        name="Maximum retries"
        desc="Maximum number of retry attempts for failed requests."
      >
        <input
          type="number"
          className="onyxmind-sp-input onyxmind-sp-input-sm"
          value={retries}
          min={0}
          onChange={(e) => {
            setRetries(e.target.value);
            const n = parseInt(e.target.value);
            if (!isNaN(n) && n >= 0) void save({ maxRetries: n });
          }}
        />
      </SettingRow>

      <SettingRow
        name="Stream responses"
        desc="Show AI responses in real-time as they are generated."
      >
        <Toggle
          checked={stream}
          onChange={(v) => {
            setStream(v);
            void save({ streamResponse: v });
          }}
        />
      </SettingRow>
    </div>
  );
}

// ── Permission tab ─────────────────────────────────────────────────────────

function PathListEditor({
  paths,
  onChange,
  placeholder,
}: {
  paths: string[];
  onChange: (paths: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !paths.includes(trimmed)) {
      onChange([...paths, trimmed]);
      setInput("");
    }
  };

  return (
    <div className="onyxmind-sp-path-field">
      {paths.map((p) => (
        <span key={p} className="onyxmind-sp-path-tag">
          {p}
          <button
            className="onyxmind-sp-path-tag-remove"
            aria-label={`Remove ${p}`}
            onClick={() => onChange(paths.filter((x) => x !== p))}
          >
            ✕
          </button>
        </span>
      ))}
      <input
        type="text"
        className="onyxmind-sp-path-inline-input"
        value={input}
        placeholder={paths.length === 0 ? (placeholder ?? "e.g. Journal/") : ""}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
          if (e.key === "Backspace" && input === "" && paths.length > 0) {
            onChange(paths.slice(0, -1));
          }
        }}
      />
    </div>
  );
}

function PermissionTab({ plugin }: { plugin: OnyxMindPlugin }) {
  const perm = plugin.settings.permissions;

  const savePerm = async (updates: Partial<PermissionConfig>) => {
    plugin.settings.permissions = {
      ...plugin.settings.permissions,
      ...updates,
    };
    await plugin.saveSettings();
  };

  const [writeMode, setWriteMode] = useState(perm.writeMode);
  const [allowDelete, setAllowDelete] = useState(perm.allowDelete);
  const [protectedPaths, setProtectedPaths] = useState(perm.protectedPaths);
  const [allowedPaths, setAllowedPaths] = useState(perm.allowedPaths);
  const [frontmatter, setFrontmatter] = useState(
    perm.respectFrontmatterProtection,
  );

  return (
    <div className="onyxmind-sp-rows">
      <div className="onyxmind-sp-section">Write Permissions</div>

      <SettingRow
        name="Yolo mode"
        desc="Allow agent to modify notes without asking for confirmation."
      >
        <Toggle
          checked={writeMode === "allow"}
          onChange={(v) => {
            const mode = v ? "allow" : "ask";
            setWriteMode(mode);
            void savePerm({ writeMode: mode });
          }}
        />
      </SettingRow>

      <SettingRow
        name="Allow delete"
        desc="Allow agent to delete notes. When off, delete operations always require confirmation."
      >
        <Toggle
          checked={allowDelete}
          onChange={(v) => {
            setAllowDelete(v);
            void savePerm({ allowDelete: v });
          }}
        />
      </SettingRow>

      <div className="onyxmind-sp-section">Path Restrictions</div>

      <div className="onyxmind-sp-row onyxmind-sp-row--block">
        <div className="onyxmind-sp-row-info">
          <div className="onyxmind-sp-row-name">Protected paths</div>
          <div className="onyxmind-sp-row-desc">
            Agent will never modify or delete notes in these paths.
          </div>
        </div>
        <div className="onyxmind-sp-row-ctrl">
          <PathListEditor
            paths={protectedPaths}
            placeholder="e.g. Journal/"
            onChange={(paths) => {
              setProtectedPaths(paths);
              void savePerm({ protectedPaths: paths });
            }}
          />
        </div>
      </div>

      <div className="onyxmind-sp-row onyxmind-sp-row--block">
        <div className="onyxmind-sp-row-info">
          <div className="onyxmind-sp-row-name">Allowed paths (whitelist)</div>
          <div className="onyxmind-sp-row-desc">
            Restrict agent to only operate within these paths. Leave empty to
            allow access to the entire vault.
          </div>
        </div>
        <div className="onyxmind-sp-row-ctrl">
          <PathListEditor
            paths={allowedPaths}
            placeholder="e.g. AI-Notes/"
            onChange={(paths) => {
              setAllowedPaths(paths);
              void savePerm({ allowedPaths: paths });
            }}
          />
        </div>
      </div>

      <div className="onyxmind-sp-section">Advanced</div>

      <SettingRow
        name="Respect frontmatter protection"
        desc='Prevent agent from modifying notes that have "protected: true" in their frontmatter.'
      >
        <Toggle
          checked={frontmatter}
          onChange={(v) => {
            setFrontmatter(v);
            void savePerm({ respectFrontmatterProtection: v });
          }}
        />
      </SettingRow>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────

type TabId = "provider" | "agent" | "permission" | "advanced";

const TABS: { id: TabId; label: string }[] = [
  { id: "provider", label: "Provider" },
  { id: "agent", label: "Agent" },
  { id: "permission", label: "Permission" },
  { id: "advanced", label: "Advanced" },
];

export function SettingsPanel({ plugin }: { plugin: OnyxMindPlugin }) {
  const [activeTab, setActiveTab] = useState<TabId>("provider");

  return (
    <div className="onyxmind-sp">
      {/* Top tab bar */}
      <div className="onyxmind-sp-tabbar" role="tablist">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            className={`onyxmind-sp-tab${activeTab === id ? " is-active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="onyxmind-sp-content" role="tabpanel">
        {activeTab === "provider" && <ProviderTab plugin={plugin} />}
        {activeTab === "agent" && <AgentTab plugin={plugin} />}
        {activeTab === "permission" && <PermissionTab plugin={plugin} />}
        {activeTab === "advanced" && <AdvancedTab plugin={plugin} />}
      </div>
    </div>
  );
}
