/**
 * Shows an uploaded image in full, whatever its shape. The image is contained
 * (never cropped) and a blurred copy of itself fills the leftover space, so a
 * square poster in a wide banner slot still looks intentional.
 *
 * Fills its parent: the parent must be `relative` with `overflow-hidden`.
 */
export function FitImage({ src, alt = "", className = "", imgClassName = "" }: { src: string; alt?: string; className?: string; imgClassName?: string }) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={`absolute inset-0 w-full h-full object-contain ${imgClassName}`} />
    </div>
  );
}
