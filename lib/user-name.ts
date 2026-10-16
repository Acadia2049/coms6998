type UserIdentity = {
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
};

export type UserNameParts = {
    firstName: string;
    lastName: string;
};

function metadataString(metadata: Record<string, unknown> | null | undefined, key: string) {
    const value = metadata?.[key];
    return typeof value === "string" ? value.trim() : "";
}

function titleCase(value: string) {
    return value
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
        .join(" ");
}

function splitFullName(value: string): UserNameParts {
    const parts = value.trim().split(/\s+/).filter(Boolean);

    return {
        firstName: parts.shift() ?? "",
        lastName: parts.join(" "),
    };
}

function nameFromEmail(email: string | null | undefined): UserNameParts {
    const localPart = email?.split("@")[0]?.split("+")[0] ?? "";
    const readable = localPart
        .replace(/([a-zA-Z])([0-9])/g, "$1 $2")
        .replace(/([0-9])([a-zA-Z])/g, "$1 $2")
        .replace(/[._-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    return splitFullName(titleCase(readable));
}

export function getUserNameParts(user: UserIdentity): UserNameParts {
    const metadata = user.user_metadata;
    const firstName = metadataString(metadata, "given_name");
    const lastName = metadataString(metadata, "family_name");

    if (firstName || lastName) {
        return { firstName, lastName };
    }

    const fullName = metadataString(metadata, "full_name") || metadataString(metadata, "name");

    if (fullName) {
        return splitFullName(fullName);
    }

    return nameFromEmail(user.email);
}

export function getUserDisplayName(user: UserIdentity) {
    const { firstName, lastName } = getUserNameParts(user);
    return [firstName, lastName].filter(Boolean).join(" ") || "Account";
}

export function getUserFirstName(user: UserIdentity) {
    return getUserNameParts(user).firstName || "Account";
}
