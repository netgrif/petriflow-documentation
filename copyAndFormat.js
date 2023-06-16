const fs = require('fs');
const path = require('path');
const readline = require("readline");

const SOURCE = 'guide';
const DIST = "docs";
const DIST_MEDIA = path.join(DIST, '_media');
const DIST_EX = path.join(DIST_MEDIA, 'examples');
const IGNORE_FILES = ['.gitkeep'];


fs.readdir(SOURCE, (err, files) => {
	files.forEach(f => {
		const stat = fs.statSync(path.join(SOURCE, f));
		if (stat.isFile()) {
			if (f.endsWith('.md')) {
				fs.copyFileSync(path.join(SOURCE, f), path.join(DIST, f));
				console.log("File " + f + " copied to " + DIST);
				const editedFile = f + '.edited';
				refactorImages(path.join(DIST, f), path.join(DIST, editedFile), DIST_MEDIA.replace(DIST, "").substring(1), () => {
					fs.copyFileSync(path.join(DIST, editedFile), path.join(DIST, f));
					fs.rmSync(path.join(DIST, editedFile));
				});
			}
		} else {
			const dest = f === 'images' ? DIST_MEDIA : (f === 'examples' ? DIST_EX : undefined);
			if (!dest) return;
			fs.readdir(path.join(SOURCE, f), (err, mediaFiles) => {
				mediaFiles.forEach(mf => {
					const mStats = fs.statSync(path.join(SOURCE, f, mf));
					if (!mStats.isFile()) return;
					if (IGNORE_FILES.includes(mf)) return;
					fs.mkdirSync(dest, {recursive: true});
					fs.copyFileSync(path.join(SOURCE, f, mf), path.join(dest, mf));
					console.log("File " + mf + " copied to " + dest);
				});
			});
		}
	});
});

function refactorImages(inputFile, outputFile, mediaDir, callback) {
	const input = fs.createReadStream(inputFile);
	const output = fs.createWriteStream(outputFile);
	const lineReader = readline.createInterface({
		input: input,
		terminal: false
	});
	lineReader.on("line", (line) => {
		if (/!\[.*]\(\S+\)/.test(line)) {
			const i = line.indexOf("![");
			if (i === -1) {
				output.write(line + '\n');
				return;
			}
			const ii = line.indexOf(")", i);
			if (ii === -1) {
				output.write(line + '\n');
				return;
			}
			const link = line.substring(i, ii + 1);
			console.log("Resolving link " + link);
			const j = link.lastIndexOf('/');
			if (j === -1) {
				output.write(line + '\n');
				return;
			}
			const image = link.substring(j + 1, link.length - 1).trim();
			console.log("Resolved image " + image);
			const jj = link.indexOf("]", i);
			if (jj === -1) {
				output.write(line + '\n');
				return;
			}
			const label = link.substring(i + 2, jj).trim();
			console.log("Resolved label " + label);
			const newLink = "![" + label + "](" + path.join(mediaDir, image) + " '" + label + "')";
			const newLine = line.replace(link, newLink);
			output.write(newLine + '\n');
		} else {
			output.write(line + '\n');
		}
	});
	lineReader.on('close', () => {
		input.close();
		output.end();
		output.close();
		callback && callback();
	});
}



