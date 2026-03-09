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
        <div className="onyxmind-welcome-title">欢迎使用 OnyxMind</div>
        <div className="onyxmind-welcome-subtitle">
          选择一个快速开始，或直接输入问题开始对话
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
        输入 <code>/</code> 可选择可用命令
      </div>
    </div>
  );
}
