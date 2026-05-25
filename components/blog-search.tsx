type Props = {
  initialQuery: string;
};

export function BlogSearch({ initialQuery }: Props) {
  return (
    <form action="/blog" className="mt-8 flex max-w-2xl gap-3" method="GET">
      <input
        aria-label="Search posts"
        className="form-field min-w-0 flex-1"
        defaultValue={initialQuery}
        name="q"
        placeholder="Search posts"
        type="search"
      />
      <button
        className="action-link action-primary"
        type="submit"
      >
        Search
      </button>
    </form>
  );
}
