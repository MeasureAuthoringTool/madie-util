import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import { Hash } from "lucide-react";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import { getLatestVersion } from "../../../../util/versionUtils";

type MeasureListItem = Measure & { component?: boolean };

interface PropTypes {
  measures: MeasureListItem[];
  onClick: () => void;
}

export const INELIGIBLE_SELECTION =
  "Select the latest version in a measure set that does not have a draft and is not a component of a composite measure to change version #";
export const VALID_CHANGE_VERSION = "Change Version #";

export default function ChangeVersionAction(props: PropTypes) {
  const { measures, onClick } = props;
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [disableChangeVersionBtn, setDisableChangeVersionBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(INELIGIBLE_SELECTION);
  const lookupId = useRef(0);

  const validateChangeVersionActionState = useCallback(async () => {
    const requestId = ++lookupId.current;
    setDisableChangeVersionBtn(true);
    setTooltipMessage(INELIGIBLE_SELECTION);

    if (measures?.length !== 1) {
      return;
    }

    const selectedMeasure = measures[0];
    if (selectedMeasure?.measureMetaData?.draft || selectedMeasure?.component) {
      return;
    }

    try {
      const measureList: MeasureListItem[] =
        await measureServiceApi.getMeasuresByMeasureSetId(
          selectedMeasure?.measureSetId,
          true
        );
      if (requestId !== lookupId.current) return;

      const hasDraft = (measureList ?? []).some(
        (measure) => measure?.measureMetaData?.draft
      );

      if (
        !hasDraft &&
        getLatestVersion(measureList)?.id === selectedMeasure?.id
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
