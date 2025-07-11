export const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
