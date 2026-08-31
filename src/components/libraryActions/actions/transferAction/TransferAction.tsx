import React, { useEffect, useState, useCallback } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { CqlLibrary } from "@madie/madie-models";
import { ArrowRightLeft } from "lucide-react";
import { useUserRoles } from "../../../../hooks/useUserRoles";
import checkUserCanEdit from "../../../../util/useCheckCanEdit";

interface PropTypes {
  libraries: CqlLibrary[];
  onClick: () => void;
  activeTab: number;
}

const isOwnerOfSelectedLibrary = (libraries) => {
  return (
    libraries &&
    libraries.every((library) => {
      return checkUserCanEdit(library?.librarySet?.owner, []);
    })
  );
};

export const NOTHING_SELECTED = "Select a library to transfer";
export const CANNOT_TRANSFER = "You cannot transfer a library you do not own";
export const MORE_THAN_ONE_NOT_OWNED =
  "You cannot transfer a library you do not own, you have selected at least 1 library that you do not own";
export const TRANSFER = "Transfer";

export default function TransferAction(props: PropTypes) {
  const { libraries, activeTab } = props;
  const [disableTransferBtn, setDisableTransferBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const userRoles = useUserRoles();
  const validateTransferActionState = useCallback(() => {
    if (libraries?.length === 0) {
      setDisableTransferBtn(true);
      setTooltipMessage(NOTHING_SELECTED);
    } else if (userRoles?.isAdmin) {
      setDisableTransferBtn(false);
      setTooltipMessage(TRANSFER);
    } else if (activeTab === 1) {
      setDisableTransferBtn(true);
      setTooltipMessage(CANNOT_TRANSFER);
    } else if (activeTab === 2 && !isOwnerOfSelectedLibrary(libraries)) {
      setDisableTransferBtn(true);
      setTooltipMessage(MORE_THAN_ONE_NOT_OWNED);
    } else {
      setDisableTransferBtn(false);
      setTooltipMessage(TRANSFER);
    }
  }, [libraries, activeTab, userRoles]);

  useEffect(() => {
    validateTransferActionState();
  }, [libraries, validateTransferActionState, activeTab]);

  return (
    <Tooltip
      data-testid="transfer-action-tooltip"
      title={tooltipMessage}
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
          onClick={props.onClick}
          disabled={disableTransferBtn}
          data-testid="transfer-action-btn"
        >
          <ArrowRightLeft size={20} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
