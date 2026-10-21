import photos from '../data/photos.json';
export function Photo({
  src,
  alt,
  className = '',
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const base = src.replace(/\.webp$/, '');
  const bundled = src.startsWith('/images/');
  const meta = (photos as Record<string, { width: number; height: number; blur: string }>)[src];
  return (
    <picture
      style={
        meta
          ? {
              backgroundImage: `url(${meta.blur})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {bundled && (
        <source
          type="image/avif"
          srcSet={priority ? `${base}.avif` : `${base}-sm.avif 480w, ${base}.avif 900w`}
          sizes="(max-width: 767px) 75vw, 40vw"
        />
      )}
      <img
        src={src}
        srcSet={bundled ? `${base}-sm.webp 400w, ${src} 900w` : undefined}
        sizes="(max-width: 600px) 100vw, 50vw"
        alt={alt}
        width={meta?.width ?? (priority ? 1600 : 900)}
        height={meta?.height ?? (priority ? 1067 : 1000)}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={className}
      />
    </picture>
  );
}
