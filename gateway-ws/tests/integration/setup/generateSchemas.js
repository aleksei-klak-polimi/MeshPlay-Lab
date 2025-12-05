import fs from 'fs';
import path from 'path';
import $RefParser from '@apidevtools/json-schema-ref-parser';

// Helper: explore channels -> subfolders -> publish/subscribe
async function processChannels() {

    const DOCS_PATH = process.env.DOCS_PATH;
    const OUTPUT_DOCS_PATH = process.env.OUTPUT_DOCS_PATH;

    if (!DOCS_PATH || !OUTPUT_DOCS_PATH) {
        console.error('Please set DOCS_PATH and OUTPUT_DOCS_PATH environment variables');
        return;
    }

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DOCS_PATH)) {
        fs.mkdirSync(OUTPUT_DOCS_PATH, { recursive: true });
    }


    const subfolders = fs.readdirSync(DOCS_PATH, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => path.join(DOCS_PATH, dirent.name));

    for (const subfolder of subfolders) {
        // Look for publish and subscribe in each subfolder
        for (const action of ['publish', 'subscribe']) {
            const actionPath = path.join(subfolder, action);
            if (!fs.existsSync(actionPath)) continue;

            // Read all YAML files in actionPath
            const files = fs.readdirSync(actionPath)
                .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

            for (const file of files) {
                const filePath = path.join(actionPath, file);

                try {
                    // Dereference directly from file
                    const dereferencedDoc = await $RefParser.dereference(filePath);

                    if (!dereferencedDoc.payload) {
                        console.warn(`Skipping ${filePath} — no payload found`);
                        continue;
                    }

                    const jsonSchema = dereferencedDoc.payload;

                    // Remove all example fields recursively
                    removeExamples(jsonSchema);

                    // Write JSON file
                    const outputFile = path.join(
                        OUTPUT_DOCS_PATH,
                        path.basename(file, path.extname(file)) + '.json'
                    );
                    fs.writeFileSync(outputFile, JSON.stringify(jsonSchema, null, 2));
                    console.log(`Generated JSON schema: ${outputFile}`);
                } catch (err) {
                    console.error(`Error processing ${filePath}:`, err.message);
                }
            }
        }
    }
}


function removeExamples(obj) {
    if (Array.isArray(obj)) {
        obj.forEach(removeExamples);
    } else if (obj && typeof obj === 'object') {
        delete obj.example; // remove example field
        Object.values(obj).forEach(removeExamples);
    }
}

export default async function generateSchemas() {
    // Run the script
    try {
        await processChannels();
        console.log('All schemas generated successfully.');
    } catch (err) {
        console.error('Error:', err);
    }
}

