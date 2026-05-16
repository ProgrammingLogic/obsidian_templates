<!-- Script is executed by a Button running the "Insert Template" command on this file. -->

<%*
// Get the active file
const file = app.workspace.getActiveFile();
if (!file) { new Notice("No active file!"); return; }

const timeStarted = await tp.system.prompt("Time started (e.g. 9:00 AM):");
if (!timeStarted) return;

const timeEnded = await tp.system.prompt("Time ended (e.g. 10:30 AM):");
if (!timeEnded) return;

const whatWasDone = await tp.system.prompt("What was done:");
if (!whatWasDone) return;

const date = tp.date.now("M/D/YYYY");

const entry = `- (${date}) [time-started:: ${timeStarted}] [time-ended:: ${timeEnded}] [what-was-done:: ${whatWasDone}]`;

const content = await app.vault.read(file);
const marker = "## Time Log";
const insertAt = content.indexOf(marker);

if (insertAt === -1) {
    new Notice("Could not find '## Time Log' section in this file.");
    return;
}

// Find the end of the marker line and insert after it
const insertPosition = content.indexOf("\n", insertAt) + 1;
const newContent = content.slice(0, insertPosition) + entry + "\n" + content.slice(insertPosition);

await app.vault.modify(file, newContent);
new Notice(`Time logged: ${timeStarted} → ${timeEnded}`);
-%>
