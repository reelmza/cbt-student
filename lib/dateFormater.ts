export const prettyDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const naturalDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);

  return naturalDate;
};
