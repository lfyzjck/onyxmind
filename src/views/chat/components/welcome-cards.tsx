import React from "react";
import {
  getWelcomeCapabilities,
  type WelcomeCapability,
} from "../welcome-capabilities";
import { t } from "../../../i18n";

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
        <div className="onyxmind-welcome-title">{t("welcome.title")}</div>
        <div className="onyxmind-welcome-subtitle">{t("welcome.subtitle")}</div>
      </div>

      <div className="onyxmind-welcome-cards">
        {getWelcomeCapabilities().map((capability) => (
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

      <div className="onyxmind-welcome-footer">{t("welcome.footer")}</div>
    </div>
  );
}
