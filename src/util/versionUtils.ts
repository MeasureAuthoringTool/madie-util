export const VERSION_LOWER_ERROR =
  "New version # must be lower than the intended final version number";
export const VERSION_REQUIRED_ERROR = "New version # is required.";
export const VERSION_FORMAT_ERROR = "New version must be in the format #.#.###";

export const VERSION_FORMAT = /^\d+\.\d+\.\d{3}$/;

export const compareVersions = (a: string = "", b: string = ""): number => {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (left[i] || 0) - (right[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

export const getLatestVersion = <T extends { version?: string }>(
  items: T[]
): T | null =>
  (items ?? []).reduce(
    (latest: T | null, item: T) =>
      !latest || compareVersions(item?.version, latest?.version) > 0
        ? item
        : latest,
    null
  );

export const validateNewVersion = <T extends { id?: string; version?: string }>(
  value: string,
  selected: T | null | undefined,
  setVersions: T[],
  duplicateError: string
): string => {
  if (!value) {
    return VERSION_REQUIRED_ERROR;
  }
  if (!selected || !VERSION_FORMAT.test(value)) {
    return VERSION_FORMAT_ERROR;
  }
  if (compareVersions(value, selected.version) >= 0) {
    return VERSION_LOWER_ERROR;
  }
  const hasDuplicate = (setVersions ?? []).some(
    (item) => item?.id !== selected.id && item?.version === value
  );
  if (hasDuplicate) {
    return duplicateError;
  }

  return "";
};
