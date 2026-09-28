const fs = require('fs');
const { marked } = require('marked');
const HTMLToDOCX = require('html-to-docx');

async function buildDocx() {
    const md = fs.readFileSync('Project_Report/prepmate_project_report.md', 'utf8');
    
    // Parse MD to HTML
    let bodyHtml = marked.parse(md);

    // Build the Title Page and Initial Pages
    const titlePage = `
    <div style="text-align: center; font-family: 'Times New Roman', serif;">
        <h1 style="font-size: 24pt; font-weight: bold; margin-bottom: 20px;">PREPMATE – AI-POWERED PLACEMENT PREPARATION PLATFORM</h1>
        <p style="font-size: 14pt; font-style: italic; margin-top: 30px;">Project report submitted in partial fulfillment of the requirement<br>for the degree of</p>
        <p style="font-size: 16pt; font-weight: bold; margin-top: 20px;">BACHELOR OF TECHNOLOGY</p>
        <p style="font-size: 14pt; font-weight: bold; margin-top: 20px;">IN</p>
        <p style="font-size: 16pt; font-weight: bold; margin-top: 20px;">COMPUTER SCIENCE AND ENGINEERING</p>
        
        <p style="font-size: 14pt; font-weight: bold; margin-top: 60px;">By:</p>
        <p style="font-size: 14pt; font-weight: bold;">[Student Name] ([Roll Number])</p>
        
        <p style="font-size: 14pt; font-weight: bold; margin-top: 60px;">UNDER THE GUIDANCE OF:</p>
        <p style="font-size: 14pt; font-weight: bold;">[Guide Name]</p>
        
        <div style="margin-top: 80px;">
            <p style="font-size: 16pt; font-weight: bold;">UNIVERSITY INSTITUTE OF TECHNOLOGY</p>
            <p style="font-size: 16pt; font-weight: bold;">HIMACHAL PRADESH UNIVERSITY, SHIMLA</p>
            <p style="font-size: 14pt; font-weight: bold;">(June, 2026)</p>
        </div>
    </div>
    <div style="page-break-before: always;"></div>
    <div style="text-align: center; font-family: 'Times New Roman', serif;">
        <p style="font-size: 14pt; font-weight: bold; margin-top: 400px;">Copyright &copy; UIT, HPU Shimla, INDIA, 2026</p>
    </div>
    <div style="page-break-before: always;"></div>
    `;

    const finalHtml = `<!DOCTYPE html>
    <html>
        <head><meta charset="utf-8"></head>
        <body>
            ${titlePage}
            <div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5;">
                ${bodyHtml}
            </div>
        </body>
    </html>`;

    const fileBuffer = await HTMLToDOCX(finalHtml, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
    });

    fs.writeFileSync('f:/PrepMate-main/PrepMate_Project_Report_Formatted.docx', fileBuffer);
    console.log("Successfully created docx");
}

buildDocx().catch(console.error);
