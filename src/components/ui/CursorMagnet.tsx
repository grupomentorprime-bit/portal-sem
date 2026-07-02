/** Marcador declarativo para elementos con cursor magnético. */
export function CursorMagnet({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span data-cursor-magnet data-cursor="button" className={className}>
      {children}
    </span>
  );
}
