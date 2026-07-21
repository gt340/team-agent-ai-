"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ padding: 24, fontFamily: "monospace", whiteSpace: "pre-wrap", background: "#fff", color: "#000" }}>
        <h2>Something broke on this page</h2>
        <p><strong>Message:</strong> {error.message}</p>
        <p><strong>Digest:</strong> {error.digest ?? "none"}</p>
        <p><strong>Stack:</strong></p>
        <pre style={{ fontSize: 12, overflow: "auto" }}>{error.stack}</pre>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
