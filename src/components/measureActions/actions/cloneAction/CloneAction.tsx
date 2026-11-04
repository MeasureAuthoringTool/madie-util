import React from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { MeasureListDTO } from "@madie/madie-models";
import { Copy } from "lucide-react";

interface PropTypes {
  measures: MeasureListDTO[];
  onClick?: () => void;
}

export const INELIGIBLE_CLONE_SELECTION = "Select a measure to clone";
export const VALID_CLONE = "Clone Measure";

export default function CloneAction(props: PropTypes) {
  const { measures, onClick } = props;
  const canClone = measures?.length === 1;

  return (
    <Tooltip
      data-testid="clone-action-tooltip"
      title={canClone ? VALID_CLONE : INELIGIBLE_CLONE_SELECTION}
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
      <div role="group" style={{ display: "inline-block" }}>
        <IconButton
          onClick={onClick}
          disabled={!canClone}
          data-testid="clone-action-btn"
          aria-label={VALID_CLONE}
        >
          <Copy size={20} />
        </IconButton>
      </div>
    </Tooltip>
  );
}
