import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ClickAwayListener,
  Grow,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import { Upload } from "lucide-react";

interface PropTypes {
  measures: Measure[];
  onClick: (exportType: string) => void;
}

export const NOTHING_SELECTED = "Select measure to export";
export const EXPORT_MEASURE = "Export measure";

export default function ExportAction(props: PropTypes) {
  const { measures, onClick } = props;

  const [disableExportBtn, setDisableExportBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const [open, setOpen] = useState(false);
  // move anchorElement to a stable reference that does not change across renders.
  const anchorRef = useRef<HTMLButtonElement>(null);

  const validateExportActionState = useCallback(() => {
    // set button state to disabled by default
    setDisableExportBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    if (measures?.length === 1) {
      setDisableExportBtn(false);
      setTooltipMessage(EXPORT_MEASURE);
    }
  }, [measures]);

  useEffect(() => {
    validateExportActionState();
  }, [measures, validateExportActionState]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!disableExportBtn) {
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOptionClick = (
    option: "Executable Export" | "Publishable Export"
  ) => {
    onClick(option);
    handleClose();
  };

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      setOpen(false);
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <>
      <Tooltip
        data-testid="export-action-tooltip"
        title={tooltipMessage}
        onMouseOver={validateExportActionState}
        arrow
        placement="top"
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
            disabled={disableExportBtn}
            data-testid="export-action-btn"
            ref={anchorRef}
          >
            <Upload size={20} />
          </IconButton>
        </span>
      </Tooltip>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        sx={{
          zIndex: 99,
        }}
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: "left top",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  autoFocusItem={open}
                  id="share-menu"
                  onKeyDown={handleListKeyDown}
                >
                  <MenuItem
                    data-testId="executable-export-option"
                    onClick={(e) => {
                      handleOptionClick("Executable Export");
                    }}
                  >
                    Executable Export
                  </MenuItem>
                  <MenuItem
                    data-testId="publishable-export-option"
                    onClick={(e) => {
                      handleOptionClick("Publishable Export");
                    }}
                  >
                    Publishable Export
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}
