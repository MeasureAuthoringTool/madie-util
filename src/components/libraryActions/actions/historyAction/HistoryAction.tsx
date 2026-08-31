import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { CqlLibrary } from "@madie/madie-models";
import { History } from "lucide-react";

interface PropTypes {
  libraries: CqlLibrary[];
  onClick: () => void;
}

export const NOTHING_SELECTED = "Select a library to view history";
export const VALID_HISTORY_LIBRARY = "View History";

export default function HistoryAction(props: PropTypes) {
  const { libraries } = props;
  const [disableHistoryBtn, setDisableHistoryBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);

  const validateHistoryActionState = useCallback(() => {
    setDisableHistoryBtn(true);
    if (libraries?.length === 1) {
      setTooltipMessage(VALID_HISTORY_LIBRARY);
      setDisableHistoryBtn(false);
    } else {
      setTooltipMessage(NOTHING_SELECTED);
    }
  }, [libraries]);

  useEffect(() => {
    validateHistoryActionState();
  }, [libraries, validateHistoryActionState]);

  const handleClick = () => {
    props.onClick();
  };

  return (
    <Tooltip
      data-testid="library-history-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateHistoryActionState}
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
          disabled={disableHistoryBtn}
          data-testid="library-history-action-btn"
        >
          <History size={20} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
