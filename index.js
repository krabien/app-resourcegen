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
    const candidates = await iconSourceCandidates();
    if (!candidates || !candidates.length) {
        console.error('no likely icon source image candidates found');
        return;
    }
    const candidate = candidates[0];
    console.log('✅ ', 'using icon source    ',  '>>>', candidate);

    const targetCandidates = await iconTargetCandidates();
    console.log('targets:')

    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const target of targetCandidates) {
        console.log(' > ', target.path);
        const outfile = target.path.replace(/\//g, '_');
        const outPath = path.join(OUT_DIR, outfile);
        await render(candidate, target.width, target.height, 8, outPath);
    }
}

async function splash() {
    const candidates = await splashSourceCandidates();
    if (!candidates || !candidates.length) {
        console.error('no likely splash source image candidates found');
        return;
    }
    const candidate = candidates[0];
    console.log('💦', 'using splash source  ', '>>>', candidate);
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
        .png()
        .toFile(outfilePath);
}

// noinspection JSUnusedLocalSymbols
async function roundCorners(radius = 50) {
    const roundedCorners = Buffer.from(
        `<svg><rect x="0" y="0" width="1024" height="1024" rx="${radius}" ry="${radius}"/></svg>`
    );

    sharp(roundedCorners)
        .composite([{
            input: roundedCorners,
            blend: 'dest-in'
        }])
        .flatten()
        .png()
        .toFile('output.png')
        .then(() => {
        })
        .catch(console.error);
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
