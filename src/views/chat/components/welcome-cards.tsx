import React from "react";
import {
  WELCOME_CAPABILITIES,
  type WelcomeCapability,
} from "../welcome-capabilities";

interface WelcomeCardsProps {
  onSelectCapability: (prompt: string) => void;
}

export function WelcomeCards(props: WelcomeCardsProps) {
  const { onSelectCapability } = props;

  const handleCardClick = (capability: WelcomeCapability) => {
    onSelectCapability(capability.prompt);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    capability: WelcomeCapability,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick(capability);
    }
  };

  return (
    <div className="onyxmind-welcome-container">
      <div className="onyxmind-welcome-header">
        <div className="onyxmind-welcome-title">Welcome to OnyxMind</div>
        <div className="onyxmind-welcome-subtitle">
          Choose a quick start option or type a question to begin
        </div>
      </div>

      <div className="onyxmind-welcome-cards">
        {WELCOME_CAPABILITIES.map((capability) => (
          <div
            key={capability.id}
            className="onyxmind-welcome-card"
            onClick={() => handleCardClick(capability)}
            onKeyDown={(e) => handleKeyDown(e, capability)}
            role="button"
            tabIndex={0}
            aria-label={`${capability.title}: ${capability.description}`}
          >
            <div className="onyxmind-welcome-card-icon">{capability.icon}</div>
            <div className="onyxmind-welcome-card-content">
              <div className="onyxmind-welcome-card-title">
                {capability.title}
              </div>
              <div className="onyxmind-welcome-card-description">
                {capability.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="onyxmind-welcome-footer">
        Type <code>/</code> to browse available commands
      </div>
    </div>
  );
}
