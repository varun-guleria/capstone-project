const fs = require('fs');

async function convert() {
    try {
        const { default: mdToDocx } = await import('@mohtasham/md-to-docx');
        const md = fs.readFileSync('Project_Report/prepmate_project_report.md', 'utf8');
        const docxBuffer = await mdToDocx(md);
        fs.writeFileSync('output.docx', docxBuffer);
        console.log("Done");
    } catch (e) {
        // try commonjs
        try {
            const mdToDocx = require('@mohtasham/md-to-docx').mdToDocx || require('@mohtasham/md-to-docx');
            const md = fs.readFileSync('Project_Report/prepmate_project_report.md', 'utf8');
            const docxBuffer = await mdToDocx(md);
            fs.writeFileSync('output.docx', docxBuffer);
            console.log("Done CJS");
        } catch (err) {
            console.error("Error:", e, err);
        }
    }
}
convert();
