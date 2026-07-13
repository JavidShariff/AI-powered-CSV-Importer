import fs from 'fs';
import path from 'path';

function findImports(dir) {
    const result = new Set();
    const files = [];

    function traverse(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue;
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                traverse(fullPath);
            } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
                files.push(fullPath);
            }
        }
    }

    traverse(dir);

    const importRegex = /from\s+['"]([^'"\.]+)['"]/g;
    const importRegex2 = /from\s+['"](@[^\/]+\/[^'"\.]+)['"]/g;
    const requireRegex = /require\(['"]([^'"\.]+)['"]\)/g;

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');

        // basic imports 
        // we want to catch things like "react", "@tanstack/react-table", "lucide-react"
        // we should ignore local paths like "./foo", "../bar" (which start with .)

        const allMatches = [...content.matchAll(/from\s+['"]([^'"]+)['"]/g), ...content.matchAll(/require\(['"]([^'"]+)['"]\)/g)];

        for (const match of allMatches) {
            const pkg = match[1];
            if (!pkg.startsWith('.')) {
                // it's a module
                result.add(pkg);
            }
        }

        // dynamic imports
        const dynamicImports = [...content.matchAll(/import\(['"]([^'"]+)['"]\)/g)];
        for (const match of dynamicImports) {
            const pkg = match[1];
            if (!pkg.startsWith('.')) {
                // it's a module
                result.add(pkg);
            }
        }
    }

    // Get base packages (e.g., 'lucide-react/icons' -> 'lucide-react', '@hookform/resolvers/zod' -> '@hookform/resolvers')
    const basePackages = new Set();
    for (const pkg of result) {
        if (pkg.startsWith('@')) {
            const parts = pkg.split('/');
            if (parts.length >= 2) {
                basePackages.add(`${parts[0]}/${parts[1]}`);
            }
        } else {
            basePackages.add(pkg.split('/')[0]);
        }
    }

    console.log(JSON.stringify(Array.from(basePackages), null, 2));
}

findImports('d:\\Javid\\internproject\\ai-csv-analyser\\ai-csv-gateway-next');
