import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data: jokes, error } = await supabase
      .from("jokes")
      .select("id, joke")
      .order("id");

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  return (
      <main>
        <h1>Jokes</h1>

        <ul>
          {jokes?.map((joke) => (
              <li key={joke.id}>{joke.joke}</li>
          ))}
        </ul>
      </main>
  );
}