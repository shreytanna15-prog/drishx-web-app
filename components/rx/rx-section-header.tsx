export function RxSectionHeader({
  number,
  title,
}: {
  number: number;
  title: string;
}) {
  return (
    <div className="mb-3 mt-6 flex items-center gap-3 first:mt-0">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-sm font-extrabold text-[var(--brand-primary-text)]">
        {number}
      </span>
      <h2 className="text-base font-extrabold text-[var(--brand-text)] sm:text-lg">
        {title}
      </h2>
    </div>
  );
}
