export function openQuickLook(assetUrl: string, title: string) {
  if (typeof document === "undefined") {
    return;
  }

  const link = document.createElement("a");
  const image = document.createElement("img");

  link.rel = "ar";
  link.href = `${assetUrl}#allowsContentScaling=1`;
  link.appendChild(image);
  image.alt = `${title} AR preview`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
