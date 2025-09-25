import Link from "fumadocs-core/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center items-center text-center">
      <IconoirInputSearch className="w-40 h-40 mb-4 text-fd-primary" />
      <h1 className="mb-4 text-5xl font-bold">
        Pre-built search experiences for your site
      </h1>
      <p className="text-fd-muted-foreground text-2xl">
        Opinionated site search experiences built with Algolia by Algolia.
      </p>
      <div className="flex justify-center items-center gap-8 mt-8">
        <Link
          href="/docs/quickstart"
          className="px-4 py-2 rounded-md border border-black bg-white text-black text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] transition duration-200"
        >
          Get started
        </Link>
        <Link
          href="/docs/experiences/search"
          className="px-4 py-2 rounded-md border border-black bg-fd-primary text-white text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] transition duration-200"
        >
          View Experiences
        </Link>
      </div>
    </main>
  );
}

function IconoirInputSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <title>Search</title>
      {/* Icon from Iconoir by Luca Burgio - https://github.com/iconoir-icons/iconoir/blob/main/LICENSE */}
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M21 12v-2a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h4m8.124 4.119a3 3 0 1 0-4.248-4.237a3 3 0 0 0 4.248 4.237m0 0L22 21"
      />
    </svg>
  );
}
