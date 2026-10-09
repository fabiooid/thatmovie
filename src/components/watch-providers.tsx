import type { WatchCountryCode } from '@/lib/countries';
import { getWatchCountryLabel } from '@/lib/countries';

type Provider = {
  id: number;
  name: string;
  logoUrl: string | null;
};

export type WatchProvidersResult = {
  title: string;
  year?: number | null;
  country: WatchCountryCode;
  matchedTitle?: string | null;
  status: string;
  message?: string | null;
  stream?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
  tmdbWatchUrl?: string | null;
};

const ProviderRow = ({
  label,
  providers,
}: {
  label: string;
  providers: Provider[];
}) => {
  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <ul className="flex flex-wrap gap-2">
        {providers.map((provider) => (
          <li
            key={`${label}-${provider.id}`}
            className="flex items-center gap-2 text-sm"
          >
            {provider.logoUrl ? (
              <img
                src={provider.logoUrl}
                alt=""
                width={28}
                height={28}
                className="size-7 rounded-md bg-background object-cover"
              />
            ) : (
              <span className="flex size-7 items-center justify-center rounded-md bg-background text-[10px] text-muted-foreground">
                {provider.name.slice(0, 2)}
              </span>
            )}
            <span>{provider.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export function WatchProvidersCard({ data }: { data: WatchProvidersResult }) {
  const countryLabel = getWatchCountryLabel(data.country);
  const stream = data.stream ?? [];
  const rent = data.rent ?? [];
  const buy = data.buy ?? [];
  const hasProviders = stream.length + rent.length + buy.length > 0;

  return (
    <div className="mt-2 max-w-[85%] space-y-3 rounded-2xl border bg-card px-4 py-3 text-sm">
      <div>
        <p className="font-medium leading-snug">
          Where to watch
          {data.title ? ` · ${data.title}` : ''}
          {data.year ? ` (${data.year})` : ''}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Based on {countryLabel}. Availability can change.
        </p>
      </div>

      {data.status === 'ok' && hasProviders ? (
        <div className="space-y-3">
          <ProviderRow label="Stream" providers={stream} />
          <ProviderRow label="Rent" providers={rent} />
          <ProviderRow label="Buy" providers={buy} />
        </div>
      ) : (
        <p className="text-muted-foreground">
          {data.message ?? 'No availability found for this country.'}
        </p>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Streaming data from{' '}
        <a
          href="https://www.justwatch.com/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          JustWatch
        </a>
        . This product uses the{' '}
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          TMDB
        </a>{' '}
        API but is not endorsed or certified by TMDB.
        {data.tmdbWatchUrl ? (
          <>
            {' '}
            <a
              href={data.tmdbWatchUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              More on TMDB
            </a>
            .
          </>
        ) : null}
      </p>
    </div>
  );
}
