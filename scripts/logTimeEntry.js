/**
 * Prompts for time tracking info and appends an entry to the active file's Time Log section.
 */
const TIME_TRACKING_DATABASE = "_DATABASES/TimeTracking";

async function buildCaseworkEntry(tp) {
    let metadata = "";

    const caseNumber = await tp.system.prompt("Case number:", tp.file.title);
    if (!caseNumber) {
        new Notice("No case number provided!");
        return null;
    }
    metadata += ` [caseNumber:: ${caseNumber}]`;
    metadata += ` [file:: [[${caseNumber}]]]`;

    return metadata.trim();
}

module.exports = async function(tp) {
    const dbFile = app.vault.getAbstractFileByPath(TIME_TRACKING_DATABASE + ".md");
    if (!dbFile) {
        new Notice(`Database ${TIME_TRACKING_DATABASE} not found!`);
        return;
    }

    const taskType = await tp.system.suggester(
        ["casework"],
        ["casework"],
        false,
        "Select task type:"
    );

    if (!taskType) {
        new Notice("taskType was not specified!");
        return;
    }

    const timeStarted = await tp.system.prompt("Time started (e.g. 9:00 AM):");
    if (!timeStarted) {
        new Notice("No time started defined!");
        return null;
    }

    const timeEnded = await tp.system.prompt("Time ended (e.g. 10:30 AM):");
    if (!timeEnded) {
        new Notice("No time ended defined!");
        return null;
    }

    const note = await tp.system.prompt("What was done:");
    if (!note) {
        new Notice("Note not defined!");
        return null;
    }
    if (note.includes("\n")) {
        new Notice("Note cannot contain newlines!");
        return null;
    }

    let entryMetadata = null;

    switch (taskType) {
        case "casework":
            entryMetadata = await buildCaseworkEntry(tp);
            break;
        default:
            new Notice(`taskType ${taskType} is not implemented`);
            return;
    }

    if (!entryMetadata) return;

    let entry = "-"
    entry += ` [type:: timeEntry]`;
    entry += ` [taskType:: ${taskType}]`;
    entry += ` [timeStarted:: ${timeStarted}]`;
    entry += ` [timeEnded:: ${timeEnded}]`;
    entry += ` [note:: ${note}]`;
    
    const date = moment().format("M/D/YYYY");
    entry += ` [date:: ${date}]`;

    entry += ` ${entryMetadata}`;

    // Append to end of database file
    const content = await app.vault.read(dbFile);
    const newContent = content.trimEnd() + `\n${entry}\n`;
    await app.vault.modify(dbFile, newContent);

    new Notice("Time entry logged!");
};
