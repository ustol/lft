import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Sign In",
    template: "%s · Lotsu Family Tree",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — decorative heritage illustration */}
      <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden lft-gradient">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* Brand mark */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <TreeIcon />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">
              Lotsu Family Tree
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-4xl font-bold leading-tight">
              Your family's story,
              <br />
              beautifully connected.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-sm">
              Build a living map of your heritage. Connect generations, preserve
              memories, and discover where you come from.
            </p>
          </div>

          {/* Testimonial / trust marker */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-5 space-y-2">
            <p className="text-white/90 text-sm italic leading-relaxed">
              "Lotsu brought my whole family together — relatives I didn't even
              know existed found us through our tree."
            </p>
            <p className="text-white/60 text-xs">
              — Ama K., Accra, Ghana
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl lft-gradient flex items-center justify-center">
            <TreeIcon className="text-white" />
          </div>
          <span className="font-display text-lg font-semibold">
            Lotsu Family Tree
          </span>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

function TreeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-5 h-5 ${className ?? ""}`}
    >
      <path d="M12 22v-7" />
      <path d="M9 8c0 0-4 1-4 6h14c0-5-4-6-4-6" />
      <path d="M7 8c0-4 5-6 5-6s5 2 5 6" />
      <path d="M9 22H6" />
      <path d="M18 22h-3" />
    </svg>
  );
}
