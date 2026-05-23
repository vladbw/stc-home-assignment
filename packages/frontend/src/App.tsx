import { useEffect, useState } from 'react';

type HealthResponse = {
  status: string;
};

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHealth() {
      try {
        const response = await fetch('/api/health', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Health request failed: ${response.status}`);
        }

        const data = (await response.json()) as HealthResponse;
        setHealth(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        setError(err instanceof Error ? err.message : 'Health request failed');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadHealth();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <main>
      <h1>STS Presentations</h1>
      <section aria-labelledby="health-heading">
        <h2 id="health-heading">Backend health</h2>
        <p>
          <code>/api/health</code>
        </p>

        {isLoading && <p>Checking backend...</p>}

        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}

        {health && <pre>{JSON.stringify(health, null, 2)}</pre>}
      </section>
    </main>
  );
}
