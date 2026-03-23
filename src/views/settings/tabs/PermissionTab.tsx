import { useState } from "react";
import type OnyxMindPlugin from "../../../main";
import { type PermissionConfig } from "../../../settings";
import { t } from "../../../i18n";
import { SettingRow, Toggle } from "../components/SettingRow";
import { PathListEditor } from "../components/PathListEditor";

interface PermissionTabProps {
  plugin: OnyxMindPlugin;
}

export function PermissionTab({ plugin }: PermissionTabProps) {
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
      <div className="onyxmind-sp-section">
        {t("settings.permission.writePerms")}
      </div>

      <SettingRow
        name={t("settings.permission.yolo")}
        desc={t("settings.permission.yolo.desc")}
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
        name={t("settings.permission.allowDelete")}
        desc={t("settings.permission.allowDelete.desc")}
      >
        <Toggle
          checked={allowDelete}
          onChange={(v) => {
            setAllowDelete(v);
            void savePerm({ allowDelete: v });
          }}
        />
      </SettingRow>

      <div className="onyxmind-sp-section">
        {t("settings.permission.pathRestrictions")}
      </div>

      <div className="onyxmind-sp-row onyxmind-sp-row--block">
        <div className="onyxmind-sp-row-info">
          <div className="onyxmind-sp-row-name">
            {t("settings.permission.protectedPaths")}
          </div>
          <div className="onyxmind-sp-row-desc">
            {t("settings.permission.protectedPaths.desc")}
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
          <div className="onyxmind-sp-row-name">
            {t("settings.permission.allowedPaths")}
          </div>
          <div className="onyxmind-sp-row-desc">
            {t("settings.permission.allowedPaths.desc")}
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

      <div className="onyxmind-sp-section">
        {t("settings.permission.advanced")}
      </div>

      <SettingRow
        name={t("settings.permission.frontmatter")}
        desc={t("settings.permission.frontmatter.desc")}
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
