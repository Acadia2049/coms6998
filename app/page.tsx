import { supabase } from "@/lib/supabase";
import CaptionCard from "./components/CaptionCard";

export default async function Home() {
    const { data: captions, error } = await supabase
        .from("captions")
        .select("id, text")
        .order("id");

    if (error) {
        return (
            <main className="page-container">
                <div className="message-box error-message">
                    <h2>Something went wrong</h2>
                    <p>{error.message}</p>
                </div>
            </main>
        );
    }

    if (!captions || captions.length === 0) {
        return (
            <main className="page-container">
                <div className="message-box">
                    <h2>No captions yet</h2>
                    <p>Check back later for new captions.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="page-container">
            <header className="page-header">
                <h1>Funny Captions</h1>
                <p>Browse captions loaded directly from Supabase.</p>
            </header>

            <div className="caption-grid">
                {captions.map((caption) => (
                    <CaptionCard
                        key={caption.id}
                        id={caption.id}
                        text={caption.text}
                    />
                ))}
            </div>
        </main>
    );
}