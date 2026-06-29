export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Portal Institucional
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Seminario Eclesiástico Mayor
        </h1>
        <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Infraestructura base en desarrollo. La conectividad con MongoDB se
          valida mediante{" "}
          <code className="rounded bg-zinc-100 px-2 py-0.5 text-sm dark:bg-zinc-900">
            GET /api/test
          </code>
          .
        </p>
      </div>
    </main>
  );
}
