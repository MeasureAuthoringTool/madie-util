import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import { Hash } from "lucide-react";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import { getLatestVersion } from "../../../../util/versionUtils";

// the measure list endpoints add `component` (true when the measure is used by
// a composite measure), which isn't on the Measure model itself
type MeasureListItem = Measure & { component?: boolean };

interface PropTypes {
  measures: MeasureListItem[];
  onClick: () => void;
}

export const NOTHING_SELECTED =
  "Select the latest version in a measure set that does not have a draft to change version #";
export const INELIGIBLE_MEASURE =
  "Select the latest version in a measure set that does not have a draft and is not a component of a composite measure to change version #";
export const VALID_CHANGE_VERSION = "Change Version #";

export default function ChangeVersionAction(props: PropTypes) {
  const { measures, onClick } = props;
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [disableChangeVersionBtn, setDisableChangeVersionBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  // guards against an earlier measure set lookup resolving after a later one
  const lookupId = useRef(0);

  const validateChangeVersionActionState = useCallback(async () => {
    const requestId = ++lookupId.current;
    setDisableChangeVersionBtn(true);

    if (measures?.length !== 1) {
      setTooltipMessage(NOTHING_SELECTED);
      return;
    }

    const selectedMeasure = measures[0];
    setTooltipMessage(INELIGIBLE_MEASURE);

    // a draft, or a component of a composite, is never eligible - no lookup needed
    if (selectedMeasure?.measureMetaData?.draft || selectedMeasure?.component) {
      return;
    }

    try {
      const measureSet: MeasureListItem[] =
        await measureServiceApi.getMeasuresByMeasureSetId(
          selectedMeasure?.measureSetId,
          true
        );
      if (requestId !== lookupId.current) return;

      const hasDraft = (measureSet ?? []).some(
        (measure) => measure?.measureMetaData?.draft
      );

      if (
        !hasDraft &&
        getLatestVersion(measureSet)?.id === selectedMeasure?.id
      ) {
        setDisableChangeVersionBtn(false);
        setTooltipMessage(VALID_CHANGE_VERSION);
      }
    } catch (error) {
      if (requestId !== lookupId.current) return;
      console.error("Unable to load measures for measure set", error);
    }
  }, [measures, measureServiceApi]);

  useEffect(() => {
    validateChangeVersionActionState();
  }, [measures, validateChangeVersionActionState]);

  return (
    <Tooltip
      data-testid="change-version-action-tooltip"
      title={tooltipMessage}
      placement="top"
      arrow
      slotProps={{
        tooltip: {
          sx: {
            zIndex: 99,
            backgroundColor: "#333",
            "& .MuiTooltip-arrow": {
              color: "#333",
            },
          },
        },
      }}
    >
      <span>
        <IconButton
          onClick={onClick}
          disabled={disableChangeVersionBtn}
          data-testid="change-version-action-btn"
          aria-label={VALID_CHANGE_VERSION}
        >
          <Hash size={20} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
