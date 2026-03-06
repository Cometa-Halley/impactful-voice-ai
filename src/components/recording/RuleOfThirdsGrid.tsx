/**
 * Rule of Thirds overlay grid for camera framing guidance.
 * Renders 2 vertical + 2 horizontal lines and a central focal indicator.
 */
export default function RuleOfThirdsGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Vertical lines */}
      <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/20" />
      <div className="absolute top-0 bottom-0 right-1/3 w-px bg-white/20" />
      {/* Horizontal lines */}
      <div className="absolute left-0 right-0 top-1/3 h-px bg-white/20" />
      <div className="absolute left-0 right-0 bottom-1/3 h-px bg-white/20" />
      {/* Central focal point */}
      
    </div>
  );
}
