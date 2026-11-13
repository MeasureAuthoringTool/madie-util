import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { CqlLibrary } from "@madie/madie-models";
import { Hash } from "lucide-react";
import useCqlLibraryServiceApi from "../../../../api/useCqlLibraryServiceApi";
import { getLatestVersion } from "../../../../util/versionUtils";

interface PropTypes {
  libraries: CqlLibrary[];
  onClick: () => void;
  canEdit?: boolean;
}

export const INELIGIBLE_SELECTION =
  "To change the version number, select exactly one library that you own or have shared access to, is the latest version in its library set, does not have a draft version, and is not a component of a composite library.";
export const VALID_CHANGE_VERSION = "Change Version #";

export default function ChangeVersionAction(props: PropTypes) {
  const { libraries, onClick, canEdit = true } = props;
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const [disableChangeVersionBtn, setDisableChangeVersionBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(INELIGIBLE_SELECTION);
  const lookupId = useRef(0);

  const validateChangeVersionActionState = useCallback(async () => {
    const requestId = ++lookupId.current;
    setDisableChangeVersionBtn(true);
    setTooltipMessage(INELIGIBLE_SELECTION);

    if (!canEdit || libraries?.length !== 1) {
      return;
    }

    const selectedLibrary = libraries[0];
    if (selectedLibrary?.draft) {
      return;
    }

    try {
      const libraryList: CqlLibrary[] =
        await cqlLibraryServiceApi.getLibrariesByLibrarySetId(
          selectedLibrary?.librarySetId,
          true
        );
      if (requestId !== lookupId.current) return;

      const hasDraft = (libraryList ?? []).some((library) => library?.draft);

      if (
        !hasDraft &&
        getLatestVersion(libraryList)?.id === selectedLibrary?.id
      ) {
        setDisableChangeVersionBtn(false);
        setTooltipMessage(VALID_CHANGE_VERSION);
      }
    } catch (error) {
      if (requestId !== lookupId.current) return;
      console.error("Unable to load libraries for library set", error);
    }
  }, [libraries, cqlLibraryServiceApi, canEdit]);

  useEffect(() => {
    validateChangeVersionActionState();
    return () => {
      lookupId.current += 1;
    };
  }, [validateChangeVersionActionState]);

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
