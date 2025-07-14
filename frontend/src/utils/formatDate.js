export const formatDate = (isoString, locale = 'en-MY', options) => {
  if (!isoString) return 'N/A';

  const date = new Date(isoString);
  if (isNaN(date)) return 'Invalid date';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return date.toLocaleDateString(locale, { ...defaultOptions, ...options });
};
