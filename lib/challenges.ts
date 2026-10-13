export type NightScene = {
    id: string;
    location: string;
    time: string;
    incident: string;
    prompt: string;
};

export type DailyChallenge = NightScene & {
    date: string;
    /**
     * Compatibility copy for the current homepage and generation flow.
     * New database writes will use `id` as the stable challenge identifier.
     */
    text: string;
    description: string;
};

const NYC_TIME_ZONE = "America/New_York";
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ROTATION_ANCHOR_DAY_NUMBER = Math.floor(Date.UTC(2026, 9, 13) / DAY_IN_MS);

/**
 * The order is intentional: October 13, 2026 starts at index 0, so the
 * following night (Wednesday, October 14) is the Butler Library scene.
 */
export const NIGHT_SCENES: readonly NightScene[] = [
    {
        id: "14th-street-empty-train",
        location: "14th Street Station",
        time: "1:13 AM",
        incident: "The last downtown train has arrived completely empty.",
        prompt: "What is one rule passengers must follow?",
    },
    {
        id: "butler-library-moving-lights",
        location: "Butler Library, Columbia University",
        time: "2:17 AM",
        incident:
            "The lights in the closed stacks have begun switching on one aisle at a time, moving toward the reading room.",
        prompt: "What is one rule students must follow until the pattern stops?",
    },
    {
        id: "staten-island-ferry-upper-deck",
        location: "Last Staten Island Ferry",
        time: "2:40 AM",
        incident:
            "The ferry has left the terminal, but someone is still waving from the locked upper deck.",
        prompt: "What is one rule passengers must follow before docking?",
    },
    {
        id: "washington-square-missing-arch",
        location: "Washington Square Park",
        time: "12:47 AM",
        incident:
            "The arch disappears whenever the fountain goes silent, and the exits no longer lead to the same streets.",
        prompt: "What is one rule visitors must follow to leave the park?",
    },
    {
        id: "chinatown-laundromat-extra-cycle",
        location: "Chinatown Laundromat",
        time: "3:06 AM",
        incident:
            "Every dryer has stopped except number eight, which has started counting down from a time no one selected.",
        prompt: "What is one rule customers must follow before the cycle ends?",
    },
    {
        id: "riverside-park-tunnel-footsteps",
        location: "Riverside Park Tunnel",
        time: "1:28 AM",
        incident:
            "A second set of footsteps begins each time someone reaches the middle of the tunnel.",
        prompt: "What is one rule pedestrians must follow until they reach the other side?",
    },
    {
        id: "bodega-aisle-seven",
        location: "24-Hour Bodega",
        time: "2:22 AM",
        incident:
            "The clerk has locked the door and quietly removed every price tag from aisle seven.",
        prompt: "What is one rule customers must follow before the door opens again?",
    },
    {
        id: "times-square-dark-screens",
        location: "Times Square",
        time: "3:33 AM",
        incident:
            "Every screen has gone dark except one, which is showing the crowd from five minutes in the future.",
        prompt: "What is one rule everyone in the square must follow?",
    },
    {
        id: "roosevelt-island-tram-third-stop",
        location: "Roosevelt Island Tram",
        time: "12:58 AM",
        incident:
            "The tram has paused above the river and announced a third stop that does not appear on the route map.",
        prompt: "What is one rule riders must follow before the doors open?",
    },
    {
        id: "sealed-subway-entrance-apartment",
        location: "Apartment Above a Sealed Subway Entrance",
        time: "1:44 AM",
        incident:
            "A train can be heard stopping beneath the building, followed by footsteps climbing a staircase that was filled with concrete.",
        prompt: "What is one rule residents must follow until morning?",
    },
    {
        id: "coney-island-last-ride",
        location: "Coney Island Boardwalk",
        time: "2:51 AM",
        incident:
            "The amusement park is closed, but the oldest ride has started running with one occupied car.",
        prompt: "What is one rule anyone still on the boardwalk must follow?",
    },
    {
        id: "queens-night-bus-last-stop",
        location: "Queens-Bound Night Bus",
        time: "3:17 AM",
        incident:
            "The route display has replaced every remaining stop with the same unfamiliar street name.",
        prompt: "What is one rule passengers must follow before requesting a stop?",
    },
    {
        id: "brooklyn-stairwell-extra-floor",
        location: "Brooklyn Apartment Stairwell",
        time: "12:36 AM",
        incident:
            "A new floor has appeared between the fourth and fifth landings, and its hallway light is already on.",
        prompt: "What is one rule tenants must follow when passing it?",
    },
    {
        id: "grand-central-lower-platform",
        location: "Lower Platform Beneath Grand Central",
        time: "1:09 AM",
        incident:
            "An arrival board is listing a train on a platform that has been closed for decades.",
        prompt: "What is one rule late-night travelers must follow when it arrives?",
    },
];

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
    const daysSinceAnchor = dayNumber - ROTATION_ANCHOR_DAY_NUMBER;
    const sceneIndex =
        ((daysSinceAnchor % NIGHT_SCENES.length) + NIGHT_SCENES.length) %
        NIGHT_SCENES.length;
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const scene = NIGHT_SCENES[sceneIndex];

    return {
        ...scene,
        date,
        text: `${scene.incident} ${scene.prompt}`,
        description: `${scene.location} · ${scene.time}`,
    };
}

export function getNightSceneById(id: string) {
    return NIGHT_SCENES.find((scene) => scene.id === id) ?? null;
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
