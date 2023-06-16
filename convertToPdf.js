const fs = require('fs');
const path = require('path');
const {mdToPdf} = require('md-to-pdf');


(async () => {
	const pdf = await mdToPdf({path: path.join('docs', 'index.md')}, {
		dest: path.join('docs', '_media', 'pdf', 'petriflow-guide.pdf'),
		basedir: 'docs',
		document_title: 'Petriflow Guide',
		port: 3003
	}).catch(console.error);
	if (pdf) {
		fs.writeFileSync(pdf.filename, pdf.content);
	}
})();
