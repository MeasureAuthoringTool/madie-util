import React, { useState } from "react";
import { Box, Divider, Typography } from "@mui/material";
import { MadieDialog, Tab, Tabs } from "@madie/madie-design-system/dist/react";
import { CqlLibrary } from "@madie/madie-models";
import "./CompareVersionsDialog.scss";
import LibraryComparisonPanel from "./LibraryComparisonPanel";
import CqlDiffViewer from "./CqlDiffViewer";
import LibraryNameDiff from "./LibraryNameDiff";

interface CompareVersionsDialogProps {
  libraries: CqlLibrary[] | null | undefined;
  open: boolean;
  onClose: () => void;
}

export const getNewestLibraryInstance = (
  libraries: CqlLibrary[]
): CqlLibrary => {
  const [a, b] = libraries;

  const isDraftA = a.draft;
  const isDraftB = b.draft;

  // A draft library is always the newest
  if (isDraftA && !isDraftB) return a;
  if (isDraftB && !isDraftA) return b;

  // Compare versions numerically (major.minor.patch)
  const vA = a.version.split(".").map(Number);
  const vB = b.version.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    if (vA[i] > vB[i]) return a;
    if (vB[i] > vA[i]) return b;
  }

  // Versions are equal — fallback to the first library
  return a;
};

const CompareVersionsDialog = ({
  libraries,
  open,
  onClose,
}: CompareVersionsDialogProps) => {
  const [activeTab, setActiveTab] = useState<string>("cql");

  if (!libraries || libraries.length !== 2) return null;

  const newLibrary = getNewestLibraryInstance(libraries);
  const oldLibrary = newLibrary === libraries[0] ? libraries[1] : libraries[0];

  return (
    <MadieDialog
      form
      title="Compare Library Versions"
      dialogProps={{
        onClose,
        open,
        maxWidth: "xxl",
        "data-testid": "compare-versions-dialog",
      }}
      cancelButtonProps={{
        variant: "outline",
        cancelText: "Close",
        "data-testid": "compare-versions-close-button",
      }}
      titleBoxSx={{ padding: "20px 24px" }}
      contentSx={{ padding: 0 }}
    >
      <Box className="library-info-container">
        <Typography variant="h6">
          <span className="library-name" data-testid="library-name">
            <LibraryNameDiff
              oldLibraryName={oldLibrary.cqlLibraryName}
              newLibraryName={newLibrary.cqlLibraryName}
            />
          </span>
        </Typography>
      </Box>

      <Divider className="divider" />

      <div className="horizontal-padding">
        <Tabs type="B" id="compare-versions-navs" value="cql">
          <Tab
            tabIndex={0}
            aria-label="CQL tab panel"
            type="B"
            label="CQL"
            data-testid="cql-tab"
            value="cql"
          />
        </Tabs>
      </div>

      <Divider className="divider" />

      {activeTab === "cql" && (
        <>
          <div
            className="cql-comparison-panels-container"
            data-testid="tab-content-cql"
          >
            <LibraryComparisonPanel library={oldLibrary} side="old" />
            <LibraryComparisonPanel library={newLibrary} side="new" />
          </div>

          <div className="cql-diff-viewer">
            <CqlDiffViewer oldLibrary={oldLibrary} newLibrary={newLibrary} />
          </div>
        </>
      )}
    </MadieDialog>
  );
};

export default CompareVersionsDialog;
