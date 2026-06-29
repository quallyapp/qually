import { Link } from "@tanstack/react-router";

const internalLinkMap: Record<string, string> = {
  "Explore": "/explore",
  "Post a Bounty": "/post",
  "Leaderboard": "/leaderboard",
};

const externalLinkMap: Record<string, string> = {
  "Docs": "#",
  "Terms of Service": "#",
  "Privacy Policy": "#",
  "Twitter": "#",
  "Discord": "#",
  "GitHub": "#",
};

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <footer className="border-t border-border mt-20">
        <div className="mx-auto max-w-[1280px] px-6 py-6 flex flex-wrap items-center gap-4 justify-between text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Qually" className="size-8 rounded-md object-contain" />
            <span>Qually</span>
            <span className="text-on-surface-variant/70">© 2026 Qually. Built on Sui.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Support</a>
            <a href="#" className="hover:text-foreground">Github</a>
          </div>
        </div>
      </footer>
    );
  }
  return (
    <footer className="border-t border-border mt-24 bg-surface-low">
      <div className="mx-auto max-w-[1280px] px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="Qually" className="size-10 rounded-md object-contain" />
          </div>
          <p className="text-sm text-on-surface-variant max-w-xs">
            The foundational layer for technical work on the Sui Network. Precision engineered for high-stakes contributions.
          </p>
          <p className="text-label-mono mt-6 text-on-surface-variant">© 2026 Qually. Built on Sui.</p>
        </div>
        {[
          { title: "Platform", links: ["Explore", "Post a Bounty", "Leaderboard"] },
          { title: "Resources", links: ["Docs", "Terms of Service", "Privacy Policy"] },
          { title: "Connect", links: ["Twitter", "Discord", "GitHub"] },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="text-label-caps text-on-surface-variant mb-4">{col.title}</h4>
            <ul className="space-y-3">
              {col.links.map((l) => (
                <li key={l}>
                  {internalLinkMap[l] ? (
                    <Link to={internalLinkMap[l]} className="text-sm underline-offset-4 hover:underline hover:text-primary">{l}</Link>
                  ) : (
                    <a href={externalLinkMap[l] || "#"} className="text-sm underline-offset-4 hover:underline hover:text-primary">{l}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
