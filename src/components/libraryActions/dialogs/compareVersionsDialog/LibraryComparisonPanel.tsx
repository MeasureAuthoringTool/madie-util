import React from "react";
import { Chip, Typography } from "@mui/material";
import { CqlLibrary } from "@madie/madie-models";
import "./CompareVersionsDialog.scss";

interface LibraryComparisonPanelProps {
  library: CqlLibrary;
  side: "old" | "new";
}

export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

const LibraryComparisonPanel = ({
  library,
  side,
}: LibraryComparisonPanelProps) => {
  const lastUpdatedText = `Last updated on ${formatDate(
    library.lastModifiedAt
  )}`;

  return (
    <div className="comparison-panel" data-testid={`library-panel-${side}`}>
      <div className="info-section" data-testid={`version-section-${side}`}>
        <div className="library-version-row">
          <div className="version-chip-row">
            <Typography className="version-text">
              Version {library.version}
            </Typography>
            {library?.draft && (
              <Chip
                label="Draft"
                className="draft-chip"
                data-testid={`draft-chip-${side}`}
              />
            )}
          </div>
          <Typography
            className="last-updated"
            data-testid={`last-updated-${side}`}
          >
            {lastUpdatedText}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default LibraryComparisonPanel;
