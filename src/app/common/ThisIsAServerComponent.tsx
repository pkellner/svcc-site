import "server-only";

export default function ThisIsAServerComponent({ id }: { id: number | undefined }) {
  return <div>Server Component Here id:{id}</div>;
}
