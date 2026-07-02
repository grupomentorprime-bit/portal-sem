interface FooterSectionHeadingProps {
  title: string;
}

export function FooterSectionHeading({ title }: FooterSectionHeadingProps) {
  if (!title) return null;

  return (
    <h3 className="portal-footer-premium__heading">{title}</h3>
  );
}
