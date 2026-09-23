import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[70svh] flex-col justify-center py-32">
      <p className="label text-signal">404</p>
      <h1 className="mt-6 max-w-[16ch] text-d2 font-semibold">
        That page isn&rsquo;t on the{" "}
        <span className="em-serif text-signal">bench</span>.
      </h1>
      <p className="mt-6 max-w-[46ch] text-lead text-muted">
        The link may be out of date, or the page may have moved.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-full bg-signal px-6 py-3 text-sm font-medium text-on-signal transition-colors hover:bg-content"
        >
          Back home
        </Link>
        <Link
          href="/#work"
          className="rounded-full border border-[var(--line-strong)] px-6 py-3 text-sm font-medium transition-colors hover:border-signal hover:text-signal"
        >
          See the work
        </Link>
      </div>
    </div>
  );
}
