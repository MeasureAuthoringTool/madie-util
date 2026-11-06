import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { MeasureListDTO } from "@madie/madie-models";
import { Hash } from "lucide-react";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import { getLatestVersion } from "../../../../util/versionUtils";

interface PropTypes {
  measures: MeasureListDTO[];
  onClick: () => void;
  canEdit?: boolean;
}

export const INELIGIBLE_SELECTION =
  "To change the version number, select exactly one measure that you own or have shared access to, is the latest version in its measure set, does not have a draft version, and is not a component of a composite measure.";
export const VALID_CHANGE_VERSION = "Change Version #";

export default function ChangeVersionAction(props: PropTypes) {
  const { measures, onClick, canEdit = true } = props;
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [disableChangeVersionBtn, setDisableChangeVersionBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(INELIGIBLE_SELECTION);
  const lookupId = useRef(0);

  const validateChangeVersionActionState = useCallback(async () => {
    const requestId = ++lookupId.current;
    setDisableChangeVersionBtn(true);
    setTooltipMessage(INELIGIBLE_SELECTION);

    if (!canEdit || measures?.length !== 1) {
      return;
    }

    const selectedMeasure = measures[0];
    if (selectedMeasure?.measureMetaData?.draft || selectedMeasure?.component) {
      return;
    }

    try {
      const measureList = await measureServiceApi.getMeasuresByMeasureSetId(
        selectedMeasure?.measureSetId,
        true
      );
      if (!measureList || requestId !== lookupId.current) return;

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
  }, [measures, measureServiceApi, canEdit]);

  useEffect(() => {
    validateChangeVersionActionState();
    return () => {
      lookupId.current += 1;
    };
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
          disabled={!canEdit || disableChangeVersionBtn}
          data-testid="change-version-action-btn"
          aria-label={VALID_CHANGE_VERSION}
        >
          <Hash size={20} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
