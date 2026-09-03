import React, { useEffect, useMemo, useRef, useState } from "react";
import { Divider } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { MadieDialog, TextField } from "@madie/madie-design-system/dist/react";
import { Measure } from "@madie/madie-models";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import { compareVersions } from "../../../../util/versionUtils";
import "./ChangeVersionDialog.scss";

interface ChangeVersionDialogProps {
  measures: Measure[];
  open: boolean;
  onClose: () => void;
}

export const VERSION_CHANGE_CRITERIA = [
  "Enter a version number that comes before your intended final version.",
  "The version number you enter must not be one that has been used previously for this measure.",
  "After this version # change is complete, you may version the draft measure again to produce the intended final version.",
];

export const NEW_VERSION_TOOLTIP =
  "Enter the version number you wish to change this measure to.";

export const formatVersionDate = (date: string): string =>
  date ? new Date(date).toLocaleDateString("en-US") : "";

export default function ChangeVersionDialog({
  measures,
  open,
  onClose,
}: ChangeVersionDialogProps) {
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const selectedMeasure = measures?.length === 1 ? measures[0] : null;

  const [newVersion, setNewVersion] = useState("");
  const [versionsExpanded, setVersionsExpanded] = useState(false);
  const [measureSetVersions, setMeasureSetVersions] = useState<Measure[]>([]);

  useEffect(() => {
    if (!open || !selectedMeasure?.measureSetId) {
      // reset so the next open starts clean
      setNewVersion("");
      setVersionsExpanded(false);
      setMeasureSetVersions([]);
      return;
    }
    let cancelled = false;
    measureServiceApi
      .getMeasuresByMeasureSetId(selectedMeasure.measureSetId, true)
      .then((results: Measure[]) => {
        if (!cancelled) setMeasureSetVersions(results ?? []);
      })
      .catch((error) => {
        if (!cancelled) {
          setMeasureSetVersions([]);
          console.error("Unable to load measures for measure set", error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, selectedMeasure?.measureSetId, measureServiceApi]);

  const sortedVersions = useMemo(
    () =>
      [...measureSetVersions].sort((a, b) =>
        compareVersions(b?.version, a?.version)
      ),
    [measureSetVersions]
  );

  if (!open || !selectedMeasure) return null;

  return (
    <MadieDialog
      form
      required
      title="Change Version #"
      dialogProps={{
        open,
        onClose,
        // save is out of scope for this story
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
        <div className="selected-measure" data-testid="selected-measure">
          <div className="selected-measure-label">Selected Measure</div>
          <div
            className="selected-measure-name"
            data-testid="selected-measure-name"
          >
            {selectedMeasure.measureName}
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
              {selectedMeasure.version}
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

        <div className="measure-versions">
          <button
            type="button"
            className="measure-versions-toggle"
            data-testid="measure-versions-toggle"
            aria-expanded={versionsExpanded}
            aria-controls="measure-versions-panel"
            onClick={() => setVersionsExpanded((expanded) => !expanded)}
          >
            <span>
              Measure Versions{" "}
              <span className="measure-versions-count">
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
              className="measure-versions-panel"
              id="measure-versions-panel"
              data-testid="measure-versions-panel"
            >
              {sortedVersions.length === 0 ? (
                <div className="no-versions">No versions found.</div>
              ) : (
                <table data-testid="measure-versions-table">
                  <thead>
                    <tr>
                      <th scope="col">Version #</th>
                      <th scope="col">Measure Name</th>
                      <th scope="col">Version Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedVersions.map((measure, index) => (
                      <tr key={measure.id} data-testid={`version-row-${index}`}>
                        <td>
                          {measure.version}
                          {measure.id === selectedMeasure.id && " (Current)"}
                        </td>
                        <td>{measure.measureName}</td>
                        <td>{formatVersionDate(measure.lastModifiedAt)}</td>
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
