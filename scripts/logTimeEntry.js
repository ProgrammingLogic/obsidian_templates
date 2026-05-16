/**
 * Prompts for time tracking info and appends an entry to the active file's Time Log section.
 */
module.exports = async function(tp) {
    const file = app.workspace.getActiveFile();
    if (!file) { new Notice("No active file!"); return; }

    const timeStarted = await tp.system.prompt("Time started (e.g. 9:00 AM):");
    if (!timeStarted) return;

    const timeEnded = await tp.system.prompt("Time ended (e.g. 10:30 AM):");
    if (!timeEnded) return;

    const whatWasDone = await tp.system.prompt("What was done:");
    if (!whatWasDone) return;

    const date = moment().format("M/D/YYYY");
    const entry = `- (${date}) [time-started:: ${timeStarted}] [time-ended:: ${timeEnded}] [what-was-done:: ${whatWasDone}]`;

    const content = await app.vault.read(file);
    const marker = "## Time Log";
    const insertAt = content.indexOf(marker);

    if (insertAt === -1) {
        new Notice("Could not find '## Time Log' section in this file.");
        return;
    }

    let insertPos = content.indexOf("\n", insertAt) + 1;
    const nextLineEnd = content.indexOf("\n", insertPos);
    if (content.substring(insertPos, nextLineEnd).trim().startsWith("<!--")) {
        insertPos = nextLineEnd + 1;
    }

    const newContent = content.slice(0, insertPos) + entry + "\n" + content.slice(insertPos);
    await app.vault.modify(file, newContent);

    new Notice(`Logged: ${timeStarted} → ${timeEnded}`);
};
