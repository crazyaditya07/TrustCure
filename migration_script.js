const fs = require('fs');
const path = require('path');
// Try to resolve esbuild from frontend node_modules
let esbuild;
try {
    esbuild = require('./frontend/node_modules/esbuild');
} catch (e) {
    console.error("Could not find esbuild in frontend node_modules. Make sure it is installed.");
    process.exit(1);
}

const srcComponents = path.resolve('d:/TrustCure1/app/src/components');
const destComponents = path.resolve('d:/TrustCure1/frontend/src/components');
const srcPages = path.resolve('d:/TrustCure1/app/src/pages');
const destPagesNew = path.resolve('d:/TrustCure1/frontend/src/pages_new');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function processFile(srcPath, destPath) {
    const ext = path.extname(srcPath);
    // Ignore .DS_Store and unknown files if needed, but keeping simple
    if (ext === '.tsx' || ext === '.ts') {
        const content = fs.readFileSync(srcPath, 'utf8');
        try {
            const result = esbuild.transformSync(content, {
                loader: ext.slice(1),
                format: 'esm',
            });
            // Output as .jsx for consistency with existing project
            const newDest = destPath.replace(/\.tsx?$/, '.jsx');
            fs.writeFileSync(newDest, result.code);
            console.log(`Converted: ${srcPath} -> ${newDest}`);
        } catch (e) {
            console.error(`Error converting ${srcPath}:`, e);
        }
    } else if (ext === '.jsx' || ext === '.js' || ext === '.css' || ext === '.json') {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
}

function processDirectory(srcDir, destDir) {
    ensureDir(destDir);
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);

        if (entry.isDirectory()) {
            processDirectory(srcPath, destPath);
        } else {
            processFile(srcPath, destPath);
        }
    }
}

console.log("Starting migration...");
processDirectory(srcComponents, destComponents);
console.log("Components migrated.");
processDirectory(srcPages, destPagesNew);
console.log("Pages migrated (to pages_new).");
