#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');

const OUT_DIR = 'app-resourcegen-out';

both().catch(e => {
    console.error(e);
});

async function both() {
    await icon();
    await splash();
}

async function icon() {
    const sourceCandidates = await iconSourceCandidates();
    if (!sourceCandidates || !sourceCandidates.length) {
        console.error('no likely icon source image candidates found');
        return;
    }
    const source = sourceCandidates[0];
    console.log('✅ ', 'using icon source    ',  '>>>', source);
    const targetCandidates = await iconTargetCandidates();
    if (!targetCandidates.length) {
        console.error('   no icon target candidates found');
    }
    return process(source, targetCandidates);
}

async function splash() {
    const sourceCandidates = await splashSourceCandidates();
    if (!sourceCandidates || !sourceCandidates.length) {
        console.error('no likely splash source image candidates found');
        return;
    }
    const source = sourceCandidates[0];
    console.log('💦', 'using splash source  ', '>>>', source);
    const targetCandidates = await splashTargetCandidates();
    if (!targetCandidates.length) {
        console.error('   no splash target candidates found');
    }
    return process(source, targetCandidates);
}

async function process(source, targetCandidates) {
    console.log('targets:');
    // create output directory
    fs.mkdirSync(OUT_DIR, { recursive: true });
    // create .gitignore file for our generated resources
    const gitignore = path.join(OUT_DIR, '.gitignore');
    if (!fs.existsSync(gitignore)) {
        fs.writeFileSync(path.join(OUT_DIR, '.gitignore'), '**\n');
    }
    for (const target of targetCandidates) {
        console.log(' > ', target.path);
        let outfile = target.path;

        const outPath = path.join(OUT_DIR, outfile);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        await render(source, target.width, target.height, 0, outPath);
    }
}

async function render(path, width, height, cornerRadiusPercent, outfilePath) {
    const radiusW = width / (100/cornerRadiusPercent);
    const radiusH = height / (100/cornerRadiusPercent);
    const roundedCorners = Buffer.from(
        `<svg><rect x="0" y="0" width="${width}" height="${height}" rx="${radiusW}" ry="${radiusH}"/></svg>`
    );

    const pipeline = sharp(path)
        .resize(width, height);
    if (cornerRadiusPercent) {
        pipeline.composite([{
                input: roundedCorners,
                blend: 'dest-in'
            }]);
    } else {
        pipeline.flatten();
    }
    return pipeline
        .toFile(outfilePath);
}

async function iconTargetCandidates() {
    const candidates = [];
    const allImages = await findImages();
    for (const imagePath of allImages) {
        if (imagePath.toLowerCase().match(/.*icon.*(@[0-9]x|[0-9]{1,4})+\.png/)) {
            const info = await readImageInfo(imagePath);
            info.path = imagePath;
            candidates.push(info);
        }
    }
    return candidates;
}

async function splashTargetCandidates() {
    const candidates = [];
    const allImages = await findImages();
    for (const imagePath of allImages) {
        if (imagePath.toLowerCase().match(/.*splash.*(@[0-9]x|[0-9]{1,4})+\.(png|jpg)/)) {
            const info = await readImageInfo(imagePath);
            info.path = imagePath;
            candidates.push(info);
        }
    }
    return candidates;
}

/**
 * icon source candidates must be square and at least 1024px
 * sorted by likelihood: likeliest candidate first
 */
async function iconSourceCandidates() {
    const candidates = [];
    const allImages = await findImages();
    for (const imagePath of allImages) {
        try {
            const info = await readImageInfo(imagePath);
            if (info.width === info.height && info.width > 1023) {
                candidates.push(imagePath);
            }
        } catch (e) {
            console.error('  🚫', imagePath, e);
        }
    }
    return candidates.sort( (a, b) => {
        return scoreIcon(b) - scoreIcon(a);
    });
}

/**
 * splash source candidates must be square and at least 1200px
 * sorted by likelihood: likeliest candidate first
 */
async function splashSourceCandidates() {
    const candidates = [];
    const allImages = await findImages();
    for (const imagePath of allImages) {
        try {
            const info = await readImageInfo(imagePath);
            if (info.width === info.height && info.width > 1200) {
                candidates.push(imagePath);
            }
        } catch (e) {
            console.error('  🚫', imagePath, e);
        }
    }
    return candidates.sort( (a, b) => {
        return scoreSplash(b) - scoreSplash(a);
    });
}

function scoreIcon(filepath) {
    let score = 3;
    if (filepath.toLowerCase().includes('icon')) score++;
    if (filepath.toLowerCase().includes('resources')) score++;
    return score;
}

function scoreSplash(filepath) {
    let score = 3;
    if (filepath.toLowerCase().includes('splash')) score++;
    if (filepath.toLowerCase().includes('resources')) score++;
    return score;
}

async function readImageInfo(imagePath) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(imagePath).pipe(
            sharp()
                .on('info', resolve)
                .on('error', reject)
        ).read();
    });
}

async function findImages() {
    return new Promise( (resolve, reject) => {
        glob('**/*+(.png|.jpg|.jpeg)', {
            nocase: true,
            ignore: [OUT_DIR+'/**', 'node_modules/**', 'test/**', 'build/**', 'www/**', 'coverage/**', '.vscode/**', '.idea/**', '.e2e/**']
        }, (err, files)=>{
            if(err) {
                reject(err);
            } else {
                resolve(files);
            }
        })
    });
}
