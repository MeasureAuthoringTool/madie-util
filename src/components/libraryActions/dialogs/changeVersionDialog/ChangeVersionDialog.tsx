import React, { useEffect, useMemo, useRef, useState } from "react";
import { Divider } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { MadieDialog, TextField } from "@madie/madie-design-system/dist/react";
import { CqlLibrary } from "@madie/madie-models";
import useCqlLibraryServiceApi from "../../../../api/useCqlLibraryServiceApi";
import { compareVersions } from "../../../../util/versionUtils";
import "./ChangeVersionDialog.scss";

interface ChangeVersionDialogProps {
  libraries: CqlLibrary[];
  open: boolean;
  onClose: () => void;
}

export const VERSION_CHANGE_CRITERIA = [
  "Enter a version number that comes before your intended final version.",
  "The version number you enter must not be one that has been used previously for this library.",
  "After this version # change is complete, you may version the draft library again to produce the intended final version.",
];

export const NEW_VERSION_TOOLTIP =
  "Enter the version number you wish to change this library to.";

export const formatVersionDate = (date: string): string =>
  date ? new Date(date).toLocaleDateString("en-US") : "";

export default function ChangeVersionDialog({
  libraries,
  open,
  onClose,
}: ChangeVersionDialogProps) {
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const selectedLibrary = libraries?.length === 1 ? libraries[0] : null;

  const [newVersion, setNewVersion] = useState("");
  const [versionsExpanded, setVersionsExpanded] = useState(false);
  const [librarySetVersions, setLibrarySetVersions] = useState<CqlLibrary[]>(
    []
  );

  useEffect(() => {
    if (!open || !selectedLibrary?.librarySetId) {
      setNewVersion("");
      setVersionsExpanded(false);
      setLibrarySetVersions([]);
      return;
    }
    let cancelled = false;
    cqlLibraryServiceApi
      .getLibrariesByLibrarySetId(selectedLibrary.librarySetId, true)
      .then((results: CqlLibrary[]) => {
        if (!cancelled) setLibrarySetVersions(results ?? []);
      })
      .catch((error) => {
        if (!cancelled) {
          setLibrarySetVersions([]);
          console.error("Unable to load libraries for library set", error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, selectedLibrary?.librarySetId, cqlLibraryServiceApi]);

  const sortedVersions = useMemo(
    () =>
      [...librarySetVersions].sort((a, b) =>
        compareVersions(b?.version, a?.version)
      ),
    [librarySetVersions]
  );

  if (!open || !selectedLibrary) return null;

  return (
    <MadieDialog
      form
      required
      title="Change Version #"
      dialogProps={{
        open,
        onClose,
        onSubmit: (event) => event.preventDefault(),
        "data-testid": "change-version-dialog",
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Cancel",
        "data-testid": "change-version-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "button",
        continueText: "Save",
        "data-testid": "change-version-save-button",
      }}
      maxWidth="sm"
    >
      <div className="change-version-dialog">
        <div className="selected-library" data-testid="selected-library">
          <div className="selected-library-label">Selected Library</div>
          <div
            className="selected-library-name"
            data-testid="selected-library-name"
          >
            {selectedLibrary.cqlLibraryName}
          </div>
        </div>

        <div className="criteria">
          <div className="criteria-label">Version-change criteria:</div>
          <ul data-testid="version-change-criteria">
            {VERSION_CHANGE_CRITERIA.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>
        </div>

        <Divider sx={{ borderColor: "#8c8c8c", marginTop: "24px" }} />

        <div className="version-fields">
          <div className="current-version">
            <div className="current-version-label">Current Version #</div>
            <div
              className="current-version-value"
              data-testid="current-version-value"
            >
              {selectedLibrary.version}
            </div>
          </div>
          <div className="new-version">
            <TextField
              id="new-version-number"
              label="New Version #"
              required
              tooltipText={NEW_VERSION_TOOLTIP}
              value={newVersion}
              onChange={(event) => setNewVersion(event.target.value)}
              inputProps={{ "data-testid": "new-version-number-input" }}
            />
          </div>
        </div>

        <div className="library-versions">
          <button
            type="button"
            className="library-versions-toggle"
            data-testid="library-versions-toggle"
            aria-expanded={versionsExpanded}
            aria-controls="library-versions-panel"
            onClick={() => setVersionsExpanded((expanded) => !expanded)}
          >
            <span>
              Library Versions{" "}
              <span className="library-versions-count">
                ({sortedVersions.length})
              </span>
            </span>
            {versionsExpanded ? (
              <KeyboardArrowUpIcon />
            ) : (
              <KeyboardArrowDownIcon />
            )}
          </button>

          {versionsExpanded && (
            <div
              className="library-versions-panel"
              id="library-versions-panel"
              data-testid="library-versions-panel"
            >
              {sortedVersions.length === 0 ? (
                <div className="no-versions">No versions found.</div>
              ) : (
                <table data-testid="library-versions-table">
                  <thead>
                    <tr>
                      <th scope="col">Version #</th>
                      <th scope="col">Library Name</th>
                      <th scope="col">Version Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedVersions.map((library, index) => (
                      <tr key={library.id} data-testid={`version-row-${index}`}>
                        <td>
                          {library.version}
                          {library.id === selectedLibrary.id && " (Current)"}
                        </td>
                        <td>{library.cqlLibraryName}</td>
                        <td>{formatVersionDate(library.lastModifiedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </MadieDialog>
  );
}
