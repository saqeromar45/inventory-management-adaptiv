export default function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/adaptiv-logo.png"
      alt="ADAPTIV - Pipe Racking"
      className={`brand-logo ${className}`.trim()}
    />
  );
}
