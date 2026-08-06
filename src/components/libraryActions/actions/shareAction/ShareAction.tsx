import React, { useCallback, useEffect, useState } from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { CqlLibrary } from "@madie/madie-models";
import ShareIcon from "../../../measureActions/actions/ShareIcon";
import { useUserRoles } from "../../../../madie-madie-util";

interface PropTypes {
  libraries: CqlLibrary[];
  onClick: (option: string) => void;
  canEdit: boolean;
  userName: string;
  owners: string[];
  isSharedWithUser: boolean;
  activeTab: number;
}

export const NOTHING_SELECTED = "Select a library to share/unshare";
export const INVALID_SHARE_LIBRARY =
  "You cannot share/unshare a library you do not own";
export const VALID_SHARE_LIBRARY = "Share/Unshare";

// Tooltips that show on Shared Measures tabs
export const SHARED_TAB_NOTHING_SELECTED = "Select a library to unshare";
export const SHARED_TAB_INVALID_UNSHARE_LIBRARY =
  "You cannot unshare a library that you do not have shared access to";
export const SHARED_TAB_UNSHARE = "Unshare";

export enum SharedOptions {
  SHARE_WITH = "Share With",
  UNSHARE = "Unshare",
}

export default function ShareAction(props: PropTypes) {
  const { libraries, canEdit, userName, isSharedWithUser, activeTab } = props;
  const [disableShareBtn, setDisableShareBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(
    activeTab === 1 ? SHARED_TAB_NOTHING_SELECTED : NOTHING_SELECTED
  );
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const options =
    activeTab === 1
      ? [SharedOptions.UNSHARE]
      : [SharedOptions.SHARE_WITH, SharedOptions.UNSHARE];

  const userRoles = useUserRoles();

  const validateShareActionState = useCallback(() => {
    setDisableShareBtn(true);
    if (activeTab === 1) {
      if (libraries?.length === 0) {
        setTooltipMessage(SHARED_TAB_NOTHING_SELECTED);
      } else if (isSharedWithUser || userRoles?.isAdmin) {
        setDisableShareBtn(false);
        setTooltipMessage(SHARED_TAB_UNSHARE);
      } else {
        setTooltipMessage(SHARED_TAB_INVALID_UNSHARE_LIBRARY);
      }
    } else if (activeTab === 0 || activeTab === 2) {
      if (libraries?.length === 0) {
        setTooltipMessage(NOTHING_SELECTED);
      } else if (
        // either all libraries are owned by the user or admin share library feature is enabled
        (props.owners?.length > 0 &&
          props.owners.filter(
            (owner) => owner.toLowerCase() === userName.toLowerCase()
          ).length === props.owners.length) ||
        userRoles?.isAdmin
      ) {
        setDisableShareBtn(false);
        setTooltipMessage(VALID_SHARE_LIBRARY);
      } else {
        setTooltipMessage(INVALID_SHARE_LIBRARY);
      }
    }
  }, [
    libraries,
    canEdit,
    props.owners,
    isSharedWithUser,
    activeTab,
    userRoles,
  ]);

  useEffect(() => {
    validateShareActionState();
  }, [libraries, validateShareActionState]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setTooltipMessage(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (option: string) => {
    handleClose();

    props.onClick(option);
  };

  return (
    <Tooltip
      data-testid="share-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateShareActionState}
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
          disabled={disableShareBtn}
          data-testid="share-action-btn"
        >
          <ShareIcon />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          data-testid="share-menu"
        >
          {options.map((option) => (
            <MenuItem
              data-testid={`${option}-option`}
              key={option}
              onClick={() => handleMenuItemClick(option)}
            >
              {option}
            </MenuItem>
          ))}
        </Menu>
      </span>
    </Tooltip>
  );
}
