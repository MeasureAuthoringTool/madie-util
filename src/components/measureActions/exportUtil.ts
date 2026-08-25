import _ from "lodash";
import { format } from "date-fns";
import { getModelFamily } from "@madie/madie-models";
import { validateCompositeMeasure } from "../../util/compositeMeasureValidation";
import { getMeasureExportErrors } from "../../util/measureExportValidation";

export const generateTimestampedFileName = (
  baseName: string,
  extension: string
): string => {
  const timestamp = format(new Date(), "yyyyMMdd_HHmmss");
  return `${baseName}_${timestamp}.${extension}`;
};

export const EXPORT_FAILURE_MESSAGE =
  "Unable to Export measure. Package could not be generated. Please try again and contact the Help Desk if the problem persists.";

export const downloadZipFile = (
  exportData,
  ecqmTitle,
  model,
  version,
  warn = false,
  setToastOpen,
  setToastType,
  setToastMessage,
  setDownloadState
) => {
  const url = window.URL.createObjectURL(exportData);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `${_.trim(ecqmTitle)}-v${version}-${getModelFamily(model)}.zip`
  );
  document.body.appendChild(link);
  link.click();
  setToastOpen(true);
  setToastType("success");
  setToastMessage("Measure exported successfully");
  setDownloadState(warn ? "warning" : "success");
  document.body.removeChild(link);
};

export const parseErrorMessageFromBlob = async (blob) => {
  try {
    const errorText = await blob.text(); // Parse Blob to text
    const errorJson = JSON.parse(errorText); // Parse text to JSON
    return errorJson?.message || null; // Return the message or null
  } catch (e) {
    console.error("Error parsing response:", e);
    return null;
  }
};

export const exportMeasure = async (
  setFailureMessage,
  setDownloadState,
  abortController,
  measure,
  measureServiceApi,
  setToastOpen,
  setToastType,
  setToastMessage,
  elmErrorSeverity,
  bundleType = "export"
) => {
  setFailureMessage(null);
  setDownloadState("downloading");

  if (measure?.measureMetaData?.composite) {
    const compositeErrors = [
      ...(await validateCompositeMeasure(measure, measureServiceApi)),
      ...getMeasureExportErrors(measure),
    ];

    if (compositeErrors.length > 0) {
      setToastType("danger");
      setDownloadState("failure");
      setFailureMessage(compositeErrors);
      return;
    }
  }

  try {
    abortController.current = new AbortController();
    const { ecqmTitle, model, version } = measure ?? {};
    const { status, data } = await measureServiceApi?.getMeasureExport(
      measure.id,
      elmErrorSeverity,
      abortController.current.signal,
      bundleType
    );
    const warn = status === 201 && !measure?.measureMetaData?.draft;
    downloadZipFile(
      data,
      ecqmTitle,
      model,
      version,
      warn,
      setToastOpen,
      setToastType,
      setToastMessage,
      setDownloadState
    );
  } catch (err) {
    let responseMessage = EXPORT_FAILURE_MESSAGE;
    const errorStatus = err.response?.status;

    if (err.message === "canceled") {
      setToastOpen(false);
      setDownloadState(null);
    } else {
      setToastType("danger");
      setDownloadState("failure");

      // Parse blob response for any error status
      if (err.response?.data instanceof Blob) {
        const errorMessage = await parseErrorMessageFromBlob(err.response.data);
        if (errorMessage) {
          responseMessage = errorMessage;
        }
      }

      if (errorStatus === 409) {
        let responseErrors = [];
        if (err.response?.data instanceof Blob) {
          const errorMessage = await parseErrorMessageFromBlob(
            err.response.data
          );
          if (errorMessage) {
            responseErrors = errorMessage.split(", ").slice(1);
          }
        }
        const missing = getMeasureExportErrors(measure, responseErrors);
        if (missing.length <= 0) {
          setFailureMessage(responseMessage);
        } else if (missing.length > 0) {
          setFailureMessage(missing);
        }
      } else if (errorStatus === 400 || errorStatus === 404) {
        setFailureMessage(responseMessage);
      } else {
        setFailureMessage(EXPORT_FAILURE_MESSAGE);
      }
    }
  }
};
