import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background py-6 mt-12">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="Soliel AI"
              width={32}
              height={32}
              className="rounded-full"
            />
          </Link>
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {currentYear} Soliel AI. All rights reserved.
          </p>
        </div>
        
        <div className="flex gap-4 text-sm font-medium text-muted-foreground">
          <Link href="/courses" className="hover:text-primary transition-colors">
            Courses
          </Link>
          <Link href="/pricing" className="hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link href="/blog" className="hover:text-primary transition-colors">
            Blog
          </Link>
          <Link href="/faq" className="hover:text-primary transition-colors">
            FAQ
          </Link>
        </div>
      </div>
    </footer>
  );
}
