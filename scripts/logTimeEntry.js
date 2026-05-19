/**
 * Prompts for time tracking info and appends an entry to the time tracking database.
 */
const TIME_TRACKING_DATABASE = "_DATABASES/TimeTracking";
const TASK_TYPES = ["casework", "call", "scripting"];

/**
 * Attempts to parse and normalize a time string into "H:MM AM/PM" format.
 * Returns the normalized string, or null if it cannot be parsed.
 */
function normalizeTime(input) {
    if (!input) return null;
 
    // Match patterns like:
    //   9:00 AM, 09:00 AM, 9:00AM, 3:00 pm, 11:30, 9, 900, 9am, etc.
    const cleaned = input.trim();
    const match = cleaned.match(
        /^(\d{1,2})(?::(\d{2}))?(?:\s*(AM|PM|am|pm))?$/i
    );
    if (!match) return null;
 
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const meridiem = match[3] ? match[3].toUpperCase() : null;
 
    if (minutes < 0 || minutes > 59) return null;
    if (hours < 0 || hours > 23) return null;
 
    // Resolve AM/PM
    let resolvedMeridiem;
    if (meridiem) {
        resolvedMeridiem = meridiem;
        // Convert 24-h style input given alongside AM/PM
        if (resolvedMeridiem === "PM" && hours < 12) hours += 12;
        if (resolvedMeridiem === "AM" && hours === 12) hours = 0;
    } else {
        // No meridiem provided — treat as 24-hour time
        if (hours > 23) return null;
        resolvedMeridiem = hours < 12 ? "AM" : "PM";
    }
 
    // Convert back to 12-hour display
    let displayHours = hours % 12;
    if (displayHours === 0) displayHours = 12;
    const displayMinutes = String(minutes).padStart(2, "0");
 
    return `${displayHours}:${displayMinutes} ${resolvedMeridiem}`;
}

/**
 * Parses a normalized "H:MM AM/PM" time string into total minutes since midnight.
 */
function timeToMinutes(normalizedTime) {
    const match = normalizedTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
 
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();
 
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
 
    return hours * 60 + minutes;
}

/**
 * Prompts repeatedly until a valid, normalized time is entered.
 * Returns the normalized time string, or null if the user cancels.
 */
async function promptTime(tp, label) {
    while (true) {
        const raw = await tp.system.prompt(label);
        if (!raw) {
            new Notice(`${label} was not provided!`);
            return null;
        }
 
        const normalized = normalizeTime(raw);
        if (normalized) {
            return normalized;
        }
 
        new Notice(`"${raw}" is not a valid time. Please use a format like 9:00 AM or 3:30 PM.`);
    }
}

/**
 * Prompts repeatedly until a valid note is entered.
 * Note must not contain newlines, brackets ([ ]), or colons (:).
 * Returns the validated note string, or null if the user cancels.
 */
async function promptNote(tp) {
    while (true) {
        const note = await tp.system.prompt("What was done:");
        if (!note) {
            new Notice("Note not defined!");
            return null;
        }
 
        if (note.includes("\n")) {
            new Notice("Note cannot contain newlines. Please try again.");
            continue;
        }
        if (note.includes("[") || note.includes("]")) {
            new Notice("Note cannot contain brackets ([ or ]). Please try again.");
            continue;
        }
        if (note.includes(":")) {
            new Notice("Note cannot contain colons (:). Please try again.");
            continue;
        }
 
        return note;
    }
}
 
/**
 * Asks user for a case number and returns the formatted metadata string.
 * Returns null if no case number is provided.
 */
async function getCaseInfo(tp) {
    const caseNumber = await tp.system.prompt("Case number:", tp.file.title);
    if (!caseNumber) {
        new Notice("No case number provided!");
        return null;
    }
 
    return ` [caseNumber:: ${caseNumber}] [file:: [[${caseNumber}]]]`;
}

module.exports = async function(tp) {
    const dbFile = app.vault.getAbstractFileByPath(TIME_TRACKING_DATABASE + ".md");
    if (!dbFile) {
        new Notice(`Database ${TIME_TRACKING_DATABASE} not found!`);
        return;
    }

    let entry = "-";

    const date = moment().format("YYYY-MM-DD");
    entry += ` [date:: ${date}]`;

    const taskType = await tp.system.suggester(
        TASK_TYPES,
        ["casework", "call", "scripting"],
        false,
        "Select task type:"
    );

    if (!taskType) {
        new Notice("taskType was not specified!");
        return;
    }

    entry += ` [taskType:: ${taskType}]`;

    const timeStarted = await promptTime(tp, "Time started (e.g. 9:00 AM):");
    if (!timeStarted) return null;
 
    const timeEnded = await promptTime(tp, "Time ended (e.g. 10:30 AM):");
    if (!timeEnded) return null;

    const startMinutes = timeToMinutes(timeStarted);
    const endMinutes = timeToMinutes(timeEnded);
    const duration = endMinutes - startMinutes;

    entry += ` [timeStarted:: ${timeStarted}]`;
    entry += ` [timeEnded:: ${timeEnded}]`;
    entry += ` [duration:: ${duration}]`;
    
    const note = await promptNote(tp);
    if (!note) return null;

    entry += ` [note:: ${note}]`;

    switch (taskType) {
        case "casework":
        case "call":
            const caseInfo = await getCaseInfo(tp);
            if (!caseInfo) return null;
            entry += caseInfo;
            break;
        case "scripting":
            break;
        default:
            new Notice(`taskType ${taskType} is not implemented`);
            return;
    }

    // Append to end of database file
    const content = await app.vault.read(dbFile);
    const newContent = content.trimEnd() + `\n${entry}\n`;
    await app.vault.modify(dbFile, newContent);
 
    new Notice("Time entry logged!");
};
