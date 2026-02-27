interface JsonLdProps {
  data: Record<string, unknown>
}

/** Renders a JSON-LD structured data script in <head> */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script type="application/ld+json">
      {JSON.stringify(data)}
    </script>
  )
}
