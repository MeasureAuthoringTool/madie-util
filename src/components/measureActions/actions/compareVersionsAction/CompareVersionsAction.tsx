import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import { grey, blue } from "@mui/material/colors";
import { GitCompare } from "lucide-react";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
}

export const NOTHING_SELECTED =
  "Select 2 instances within the same measure set to compare measure versions";
export const VALID_COMPARE = "Compare Measure Versions";

export default function CompareVersionsAction(props: PropTypes) {
  const { measures } = props;
  const [disableCompareBtn, setDisableCompareBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);

  const validateCompareActionState = useCallback(() => {
    setDisableCompareBtn(true);

    if (!measures || measures.length !== 2) {
      setTooltipMessage(NOTHING_SELECTED);
      return;
    }

    const [measure1, measure2] = measures;

    if (measure1.measureSetId === measure2.measureSetId) {
      setTooltipMessage(VALID_COMPARE);
      setDisableCompareBtn(false);
    } else {
      setTooltipMessage(NOTHING_SELECTED);
    }
  }, [measures]);

  useEffect(() => {
    validateCompareActionState();
  }, [measures, validateCompareActionState]);

  const handleClick = () => {
    props.onClick();
  };

  return (
    <Tooltip
      data-testid="compare-versions-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateCompareActionState}
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
          onClick={handleClick}
          disabled={disableCompareBtn}
          data-testid="compare-versions-action-btn"
        >
          <GitCompare
            size={20}
            color={disableCompareBtn ? grey[500] : blue[500]}
          />
        </IconButton>
      </span>
    </Tooltip>
  );
}
