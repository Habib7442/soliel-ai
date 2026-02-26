import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-950 pt-20 pb-12 overflow-hidden">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 border-b border-white/5 pb-12 mb-12">
          {/* Brand Column */}
          <div className="flex flex-col items-center lg:items-start max-w-sm">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="relative w-12 h-12 transition-transform group-hover:scale-110">
                <Image
                  src="/images/v2-logo.png"
                  alt="Soliel AI"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col leading-[0.85]">
                <span className="text-xl font-black tracking-tighter text-primary">
                  Soliel AI
                </span>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary/60 ml-0.5">
                  Academy
                </span>
              </div>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed text-center lg:text-left">
              Bridging the gap between theory and industry-scale practice. Join the next generation of AI pioneers.
            </p>
          </div>
          
          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
            <Link href="/courses" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
              Courses
            </Link>
            <Link href="/bundles" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
              Bundles
            </Link>
            <Link href="/blog" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
              Blog
            </Link>
            <Link href="/faq" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
              FAQ
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-4">
          <p className="text-center text-xs font-bold text-gray-600 uppercase tracking-[0.2em]">
            &copy; {currentYear} Soliel AI Academy. All rights Reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-600 hover:text-white transition-colors">
              <span className="sr-only">Twitter</span>
              {/* Add social SVGs if needed */}
            </a>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <Link href="/privacy" className="text-[10px] font-black text-gray-700 hover:text-white transition-colors uppercase tracking-widest">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
