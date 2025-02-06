import { Notice, TFile, TFolder, App } from 'obsidian';
import { MyPluginSettings } from './settings';
import { transcribeAudio } from './transcriptionService';
import moment from 'moment'; // Use default import

export async function createDailyNote(
	app: App,
	selectedDate: string,
	audioFiles: File[],
	settings: MyPluginSettings,
	transcribeAudio: (audioFile: File) => Promise<string>
): Promise<void> {
	if (!selectedDate) {
		new Notice('Please select a date.');
		return;
	}

	if (audioFiles.length === 0) {
		new Notice('Please drop some audio files.');
		return;
	}

	// Get the journal folder and date format from settings
	const journalFolder = settings.journalFolder;
	const dateFormat = settings.dateFormat;

	// Format the selected date using the date format from settings
	const formattedDate = moment(selectedDate, 'YYYY-MM-DD').format(dateFormat);

	// Create the daily note file name
	const fileName = `${formattedDate}.md`;
	const filePath = `${journalFolder}/${fileName}`;

	// Check if the file already exists
	const fileExists = app.vault.getAbstractFileByPath(filePath) instanceof TFile;
	if (fileExists) {
		new Notice(`File ${fileName} already exists.`);
		return;
	}

	let fileContent = `# Daily Log for ${formattedDate}\n\n`;

	// Transcribe each audio file and add the transcript to the content
	for (const audioFile of audioFiles) {
		try {
			const transcript = await transcribeAudio(audioFile);
			fileContent += `## Transcript for ${audioFile.name}\n${transcript}\n\n`;
		} catch (error) {
			new Notice(`Error transcribing ${audioFile.name}: ${error}`);
			return;
		}
	}

	try {
		// Check if the folder exists, create if not
		let folder = app.vault.getAbstractFileByPath(journalFolder);
		if (!folder) {
			await app.vault.createFolder(journalFolder);
		}

		// Create the new file
		await app.vault.create(filePath, fileContent);
		new Notice(`Created daily note: ${filePath}`);
	} catch (error) {
		new Notice(`Error creating daily note: ${error}`);
	}
}
