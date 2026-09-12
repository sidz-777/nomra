import Link from 'next/link';

export default function AdminPlaceholderPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#141210] text-[#F2EBDD]">
      <div className="max-w-md w-full bg-[#1E1B18] border border-[#3A322A] rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-serif text-[#D4AF6A] mb-2">NAMORA Admin Hub</h1>
        <p className="text-sm text-[#9B8E7A] mb-6">
          Phase 2 Foundation Route Placeholder. The active admin operations console is currently live at{' '}
          <a
            href="http://localhost:3300/admin/"
            className="text-[#D4AF6A] underline"
            target="_blank"
            rel="noreferrer"
          >
            http://localhost:3300/admin/
          </a>
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 text-xs font-mono bg-[#141210] border border-[#3A322A] rounded-lg text-[#F2EBDD] hover:border-[#D4AF6A]"
        >
          &larr; Return to Foundation Home
        </Link>
      </div>
    </div>
  );
}
