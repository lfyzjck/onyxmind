import type { AvailableCommand } from "../../../core/stream";
import { CLASS_IS_SELECTED } from "../constants";
import { t } from "../../../i18n";

interface SlashMenuProps {
  open: boolean;
  commands: AvailableCommand[];
  selectedIndex: number;
  onHover: (index: number) => void;
  onSelect: (command: AvailableCommand) => void;
}

export function SlashMenu({
  open,
  commands,
  selectedIndex,
  onHover,
  onSelect,
}: SlashMenuProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="onyxmind-slash-menu"
      role="listbox"
      aria-label={t("aria.slashMenu")}
    >
      {commands.length === 0 && (
        <div className="onyxmind-slash-empty">{t("label.noCommands")}</div>
      )}
      {commands.map((command, index) => (
        <button
          key={`${command.source}:${command.name}`}
          type="button"
          role="option"
          aria-selected={index === selectedIndex}
          className={`onyxmind-slash-item ${index === selectedIndex ? CLASS_IS_SELECTED : ""}`}
          onMouseEnter={() => onHover(index)}
          onMouseDown={(event) => {
            event.preventDefault();
            onSelect(command);
          }}
        >
          <span className="onyxmind-slash-name">/{command.name}</span>
          {command.description && (
            <span className="onyxmind-slash-description">
              {command.description}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
