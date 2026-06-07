import { memo } from "react";

interface FlagProps {
  countryCode: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export const Flag = memo(({ countryCode, alt, className, width = 16, height = 12 }: FlagProps) => {
  const flagUrl = `https://flagcdn.com/${width}x${height}/${countryCode.toLowerCase()}.png`;
  
  return (
    <img
      src={flagUrl}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      style={{ display: 'inline-block' }}
    />
  );
});

Flag.displayName = "Flag";
