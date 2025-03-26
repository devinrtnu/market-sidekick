export function Footer() {
  return (
    <footer className="py-6 border-t">
      <div className="container flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Market Sidekick. All rights reserved.
        </p>
        <p>
          A financial tool for long-term investors. Market data for educational purposes only.
        </p>
      </div>
    </footer>
  )
} 