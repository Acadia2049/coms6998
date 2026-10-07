export type DailyChallenge = {
    date: string;
    text: string;
    description?: string;
};

const NYC_TIME_ZONE = "America/New_York";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const CHALLENGES = [
    "Explain the 1 train delay like it's a toxic ex.",
    "Turn your worst Columbia library experience into a movie tagline.",
    "Write a breakup text from NYC to New Jersey.",
    "Pitch a luxury fragrance inspired by a suspicious subway smell.",
    "Write a missed-connections post for two people fighting over the last bagel.",
    "Give a Times Square mascot a brutally honest LinkedIn headline.",
    "Turn a 2 a.m. bodega run into the opening line of an epic novel.",
    "Write the push notification Central Park would send after dark.",
    "Describe a Columbia group project as a New York Post headline.",
    "Create a warning label for moving to NYC with only a tote bag and a dream.",
    "Write an apology from the MTA that somehow makes everything worse.",
    "Turn overheard dorm-room drama into a Broadway musical tagline.",
    "Describe your weekend plans like a wildly overconfident subway ad.",
    "Write NYC a one-star review.",
];

const CHALLENGE_DESCRIPTIONS: Record<string, string> = {
    "Write NYC a one-star review.":
        "Complain about one thing you love to hate about the city.",
};

function getNewYorkDateParts(date: Date) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: NYC_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);

    const value = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? "";

    return {
        year: Number(value("year")),
        month: Number(value("month")),
        day: Number(value("day")),
    };
}

export function getTonightChallenge(now = new Date()): DailyChallenge {
    const { year, month, day } = getNewYorkDateParts(now);
    const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / DAY_IN_MS);
    const challengeIndex = ((dayNumber % CHALLENGES.length) + CHALLENGES.length) % CHALLENGES.length;
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const text = CHALLENGES[challengeIndex];

    return {
        date,
        text,
        description: CHALLENGE_DESCRIPTIONS[text],
    };
}

export function buildGenerationPrompt(
    challenge: DailyChallenge,
    personalAngle: string
) {
    const angleInstruction = personalAngle
        ? `The participant added this optional direction: "${personalAngle}"`
        : "The participant did not add an extra direction.";

    return [
        "You are helping with NYC After Dark, a nightly creative challenge for chronically online Columbia students exploring New York City.",
        `Tonight's challenge is: "${challenge.text}"`,
        angleInstruction,
        "Write exactly one original response that answers the challenge.",
        "Make it sharp, specific, playful, and easy to share with friends.",
        "Keep it under 280 characters. Avoid hashtags, quotation marks around the whole response, explanations, and references to copyrighted characters.",
        "Return only the response text.",
    ].join("\n");
}
