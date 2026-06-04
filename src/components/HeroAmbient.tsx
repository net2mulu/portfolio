/** Minimal hero ambience — faint center wash, sides fall off to page black */
export function HeroAmbient() {
  return (
    <div className="cinema-hero-ambient" aria-hidden>
      <div className="cinema-hero-ambient__soft" />
      <div className="cinema-hero-ambient__sides" />
    </div>
  );
}
