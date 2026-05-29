const PUBLIC_BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export const toPublicAssetUrl = (url: string) => {
  if (!url || /^(https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  if (PUBLIC_BASE && normalizedUrl.startsWith(`${PUBLIC_BASE}/`)) {
    return normalizedUrl;
  }

  return `${PUBLIC_BASE}${normalizedUrl}`;
};
