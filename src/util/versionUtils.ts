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
