export type SceneVisual = {
    image: string;
    imageAlt: string;
    imagePosition: string;
    mobileImagePosition: string;
    routeLabel: string;
    folioTitle: string;
    folioDetail: string;
    folioVariant: "ticket" | "record" | "service";
    marginNote: string;
    hiddenNote: string;
};

const DEFAULT_SCENE_VISUAL: SceneVisual = {
    image: "/images/incidents/nyc-night-street.webp",
    imageAlt: "An empty New York City street after midnight",
    imagePosition: "center center",
    mobileImagePosition: "58% center",
    routeLabel: "NEW YORK CITY / NIGHT SERVICE",
    folioTitle: "FIELD RECORD",
    folioDetail: "LOCATION UNCONFIRMED · KEEP MOVING",
    folioVariant: "record",
    marginNote: "who filed this before we arrived?",
    hiddenNote: "The timestamp predates the first public report.",
};

const SCENE_VISUALS: Record<string, SceneVisual> = {
    "14th-street-empty-train": {
        image: "/images/incidents/14th-street-station.webp",
        imageAlt: "An empty subway train waiting at a late-night Manhattan platform",
        imagePosition: "center center",
        mobileImagePosition: "67% center",
        routeLabel: "14 ST / DOWNTOWN LOCAL",
        folioTitle: "NIGHT SERVICE",
        folioDetail: "LAST ARRIVAL · PLATFORM ACCESS OPEN",
        folioVariant: "service",
        marginNote: "empty means empty — no conductor either",
        hiddenNote: "A second arrival was logged after service ended.",
    },
    "butler-library-midterm-week": {
        image: "/images/incidents/butler-library.webp",
        imageAlt: "An empty university reading room lit by desk lamps at night",
        imagePosition: "center 58%",
        mobileImagePosition: "48% center",
        routeLabel: "MORNINGSIDE HEIGHTS / 116 ST",
        folioTitle: "READING ROOM SLIP",
        folioDetail: "OVERNIGHT ACCESS · DESK 27",
        folioVariant: "record",
        marginNote: "desk 27 was removed last semester",
        hiddenNote: "The lamp was still warm when the room was checked.",
    },
    "staten-island-ferry-upper-deck": {
        image: "/images/incidents/staten-island-ferry.webp",
        imageAlt: "A Staten Island Ferry crossing New York Harbor at night",
        imagePosition: "center center",
        mobileImagePosition: "61% center",
        routeLabel: "ST. GEORGE / WHITEHALL",
        folioTitle: "NIGHT PASSAGE",
        folioDetail: "ONE WAY · UPPER DECK CLOSED",
        folioVariant: "ticket",
        marginNote: "then who unlocked the rail?",
        hiddenNote: "This ticket was found dry, although the deck was wet.",
    },
    "washington-square-missing-arch": {
        ...DEFAULT_SCENE_VISUAL,
        routeLabel: "WASHINGTON SQ / WEST 4 ST",
        folioTitle: "PARK RECORD",
        folioDetail: "FOUNTAIN ACCESS · AFTER MIDNIGHT",
        marginNote: "compare the skyline — not the arch",
        hiddenNote: "Three photos were filed. Only this one kept its date.",
    },
    "chinatown-laundromat-extra-cycle": {
        ...DEFAULT_SCENE_VISUAL,
        imagePosition: "26% center",
        mobileImagePosition: "22% center",
        routeLabel: "CHINATOWN / CANAL ST",
        folioTitle: "SERVICE TICKET",
        folioDetail: "MACHINE 08 · RECEIPT MISSING",
        folioVariant: "ticket",
        marginNote: "the cycle counter goes past 99",
        hiddenNote: "The owner says there has never been a machine eight.",
    },
    "riverside-park-tunnel-footsteps": {
        image: "/images/incidents/14th-street-station.webp",
        imageAlt: "A deserted tiled passage beneath New York at night",
        imagePosition: "12% center",
        mobileImagePosition: "8% center",
        routeLabel: "RIVERSIDE / PEDESTRIAN TUNNEL",
        folioTitle: "ACCESS RECORD",
        folioDetail: "WESTBOUND WALKWAY · OPEN",
        folioVariant: "record",
        marginNote: "footsteps stop when the river goes quiet",
        hiddenNote: "Two sets entered. The camera recorded one leaving.",
    },
    "bodega-aisle-seven": {
        ...DEFAULT_SCENE_VISUAL,
        imagePosition: "18% center",
        mobileImagePosition: "18% center",
        routeLabel: "24 HOUR SERVICE / MANHATTAN",
        folioTitle: "REGISTER COPY",
        folioDetail: "AISLE 07 · PRICES REMOVED",
        folioVariant: "ticket",
        marginNote: "receipt lists an eighth aisle",
        hiddenNote: "The total changes when read outside the store.",
    },
    "times-square-dark-screens": {
        ...DEFAULT_SCENE_VISUAL,
        imagePosition: "70% center",
        mobileImagePosition: "72% center",
        routeLabel: "TIMES SQ / 42 ST",
        folioTitle: "DISPLAY STATUS",
        folioDetail: "PUBLIC FEED · SIGNAL INTERRUPTED",
        folioVariant: "service",
        marginNote: "all screens failed on the same frame",
        hiddenNote: "A face appears only in the archived copy.",
    },
    "roosevelt-island-tram-third-stop": {
        image: "/images/incidents/staten-island-ferry.webp",
        imageAlt: "The dark East River and Manhattan skyline after midnight",
        imagePosition: "28% center",
        mobileImagePosition: "26% center",
        routeLabel: "ROOSEVELT ISLAND / 2 AV",
        folioTitle: "AERIAL TRANSFER",
        folioDetail: "TWO STOPS SCHEDULED · NIGHT SERVICE",
        folioVariant: "service",
        marginNote: "there are only two station announcements",
        hiddenNote: "The fare reader charged for a third stop.",
    },
    "sealed-subway-entrance-apartment": {
        image: "/images/incidents/brooklyn-stairwell.webp",
        imageAlt: "An empty New York apartment stairwell after midnight",
        imagePosition: "center 42%",
        mobileImagePosition: "50% center",
        routeLabel: "RESIDENTIAL ACCESS / LOWER LEVEL",
        folioTitle: "BUILDING FILE",
        folioDetail: "STAIR B · BASEMENT SEALED",
        folioVariant: "record",
        marginNote: "seal is newer than the building report",
        hiddenNote: "Someone has been sweeping the steps from below.",
    },
    "coney-island-last-ride": {
        image: "/images/incidents/staten-island-ferry.webp",
        imageAlt: "Dark New York waterfront lights reflected across the water",
        imagePosition: "8% center",
        mobileImagePosition: "12% center",
        routeLabel: "CONEY ISLAND / BOARDWALK",
        folioTitle: "SEASON PASS",
        folioDetail: "RIDES CLOSED · WATERFRONT OPEN",
        folioVariant: "ticket",
        marginNote: "the operator booth light was on",
        hiddenNote: "One punched ticket was found inside the locked car.",
    },
    "queens-night-bus-last-stop": {
        ...DEFAULT_SCENE_VISUAL,
        imagePosition: "76% center",
        mobileImagePosition: "78% center",
        routeLabel: "QUEENS BOUND / NIGHT BUS",
        folioTitle: "TRANSFER",
        folioDetail: "FINAL STOP · ROUTE UNAVAILABLE",
        folioVariant: "ticket",
        marginNote: "dispatch has no name for the last stop",
        hiddenNote: "Every passenger remembered a different street sign.",
    },
    "brooklyn-stairwell-extra-floor": {
        image: "/images/incidents/brooklyn-stairwell.webp",
        imageAlt: "A repeating Brooklyn apartment stairwell lit by one hallway bulb",
        imagePosition: "center center",
        mobileImagePosition: "48% center",
        routeLabel: "BROOKLYN / WALK-UP ACCESS",
        folioTitle: "TENANT RECORD",
        folioDetail: "FLOORS 04–05 · STAIR A",
        folioVariant: "record",
        marginNote: "someone renumbered the landing by hand",
        hiddenNote: "The extra floor disappears on the walk back down.",
    },
    "grand-central-lower-platform": {
        image: "/images/incidents/14th-street-station.webp",
        imageAlt: "An empty underground rail platform late at night",
        imagePosition: "78% center",
        mobileImagePosition: "78% center",
        routeLabel: "GRAND CENTRAL / LOWER LEVEL",
        folioTitle: "ARRIVAL RECORD",
        folioDetail: "PLATFORM CLOSED · BOARD ACTIVE",
        folioVariant: "service",
        marginNote: "departure board uses yesterday's time",
        hiddenNote: "No track number appears in the station ledger.",
    },
};

export function getSceneVisual(sceneId: string) {
    return SCENE_VISUALS[sceneId] ?? DEFAULT_SCENE_VISUAL;
}

export const SCENE_VISUAL_IDS = Object.freeze(Object.keys(SCENE_VISUALS));
