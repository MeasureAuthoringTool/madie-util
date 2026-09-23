import React, { ReactNode, useState } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import { IconButton } from "@mui/material";
import "./HowItWorks.scss";

export interface HowItWorksProps {
  children?: ReactNode;
  title?: string;
  contentId?: string;
  align?: "left" | "right";
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const HowItWorks = ({
  children,
  title = "How it Works",
  contentId = "how-it-works-content",
  align = "right",
  isOpen: isOpenProp,
  onOpenChange,
}: HowItWorksProps = {}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpenProp !== undefined;
  const isOpen = isControlled ? isOpenProp : internalOpen;
  const setIsOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const containerClass =
    align === "left"
      ? "how-it-works-container how-it-works-flush-left"
      : "how-it-works-container";

  if (!isOpen) {
    return (
      <div className={containerClass} data-testid="how-it-works">
        <button
          type="button"
          className="how-it-works-link"
          data-testid="how-it-works-link"
          aria-expanded={false}
          aria-controls={contentId}
          onClick={() => setIsOpen(true)}
        >
          <PrivacyTipIcon className="how-it-works-privacy-icon" />
          How it works
        </button>
      </div>
    );
  }

  return (
    <div className={containerClass} data-testid="how-it-works">
      <div
        className="how-it-works-info"
        id={contentId}
        data-testid="how-it-works-content"
        role="region"
        aria-label="How it works information"
      >
        <PrivacyTipIcon className="how-it-works-icon" />
        <div className="how-it-works-body">
          <strong>{title}</strong>
          {children}
        </div>
        <IconButton
          data-testid="how-it-works-close"
          aria-label="Close how it works"
          onClick={() => setIsOpen(false)}
          className="how-it-works-close"
        >
          <ClearIcon className="how-it-works-close-icon" />
        </IconButton>
      </div>
    </div>
  );
};

export default HowItWorks;
