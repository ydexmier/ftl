import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav>
        <Link href="/">Accueil</Link> | 
        <Link href="/scelle">Scelle</Link> | 
        <Link href="/sets">Sets</Link>
      </nav>
      <main>{children}</main>
    </>
  );
}
