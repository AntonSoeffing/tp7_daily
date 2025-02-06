import { Notice, TFile, TFolder, App } from 'obsidian';
import { MyPluginSettings } from './settings';
import { transcribeAudio } from './transcriptionService';
import moment from 'moment'; // Use default import

export async function createDailyNote(
	app: App,
	selectedDate: string,
	audioFiles: File[],
	settings: MyPluginSettings,
	transcribeAudio: (audioFile: File, settings: MyPluginSettings) => Promise<string>
): Promise<void> {
	if (!selectedDate) {
		new Notice('Please select a date.');
		return;
	}

	if (audioFiles.length === 0 && !settings.useTestTranscript) {
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

	let fileContent = '> [!faq]- Transcripts\n> \n';

	// Transcribe each audio file and add the transcript to the content
	if (settings.useTestTranscript) {
		const transcript = await transcribeAudio(new File([], 'test.wav'), settings);
		fileContent += `> > [!info]- Test Transcript\n> > ${transcript}\n\n`;
	} else {
		for (const audioFile of audioFiles) {
			try {
				const transcript = await transcribeAudio(audioFile, settings);
				const [date, time] = audioFile.name.split('_').slice(0, 2);
				const formattedDate = moment(date, 'YYYY-MM-DD').format(settings.dateFormat);
				const formattedTime = `${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`;
				fileContent += `> > [!info]- Transcript for ${formattedDate} at ${formattedTime}\n> > ${transcript}\n\n`;
			} catch (error) {
				new Notice(`Error transcribing ${audioFile.name}: ${error}`);
				return;
			}
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
