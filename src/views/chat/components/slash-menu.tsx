import type { AvailableCommand } from "../../../services/opencode-service";
import {
  ARIA_LABEL_SLASH_MENU,
  CLASS_IS_SELECTED,
  LABEL_NO_COMMANDS,
} from "../constants";

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
      aria-label={ARIA_LABEL_SLASH_MENU}
    >
      {commands.length === 0 && (
        <div className="onyxmind-slash-empty">{LABEL_NO_COMMANDS}</div>
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
