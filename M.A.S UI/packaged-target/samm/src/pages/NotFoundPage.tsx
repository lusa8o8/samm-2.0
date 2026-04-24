import { Link } from 'wouter';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4">
      <p className="text-4xl font-bold text-foreground">404</p>
      <p className="text-muted-foreground">Page not found</p>
      <Link href="/">
        <span className="text-primary text-sm hover:underline cursor-pointer">Return to samm</span>
      </Link>
    </div>
  );
}
