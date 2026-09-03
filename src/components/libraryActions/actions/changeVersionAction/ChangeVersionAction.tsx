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
}

export const NOTHING_SELECTED =
  "Select the latest version in a library set that does not have a draft to change version #";
export const VALID_CHANGE_VERSION = "Change Version #";

export default function ChangeVersionAction(props: PropTypes) {
  const { libraries, onClick } = props;
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const [disableChangeVersionBtn, setDisableChangeVersionBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  // guards against an earlier library set lookup resolving after a later one
  const lookupId = useRef(0);

  const validateChangeVersionActionState = useCallback(async () => {
    const requestId = ++lookupId.current;
    setDisableChangeVersionBtn(true);
    setTooltipMessage(NOTHING_SELECTED);

    if (libraries?.length !== 1) {
      return;
    }

    const selectedLibrary = libraries[0];
    // a draft is never eligible - no lookup needed
    if (selectedLibrary?.draft) {
      return;
    }

    try {
      const librarySet: CqlLibrary[] =
        await cqlLibraryServiceApi.getLibrariesByLibrarySetId(
          selectedLibrary?.librarySetId,
          true
        );
      if (requestId !== lookupId.current) return;

      const hasDraft = (librarySet ?? []).some((library) => library?.draft);

      if (
        !hasDraft &&
        getLatestVersion(librarySet)?.id === selectedLibrary?.id
      ) {
        setDisableChangeVersionBtn(false);
        setTooltipMessage(VALID_CHANGE_VERSION);
      }
    } catch (error) {
      if (requestId !== lookupId.current) return;
      console.error("Unable to load libraries for library set", error);
    }
  }, [libraries, cqlLibraryServiceApi]);

  useEffect(() => {
    validateChangeVersionActionState();
  }, [libraries, validateChangeVersionActionState]);

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
