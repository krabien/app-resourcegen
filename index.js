const fs = require('fs');
const sharp = require('sharp');
const glob = require('glob');

icon().then(() => {
        splash().then();
    }
);

async function icon() {
    const iconCandidates = await iconSourceCandidates();
    if (!iconCandidates || !iconCandidates.length) {
        console.error('no likely icon source image candidates found');
        return;
    }
    const iconCandidate = iconCandidates[0];
    console.log('using likely icon candidate', iconCandidate);
}

async function splash() {
    const iconCandidates = await iconSourceCandidates();
    if (!iconCandidates || !iconCandidates.length) {
        console.error('no likely splash source image candidates found');
        return;
    }
    const iconCandidate = iconCandidates[0];
    console.log('using likely icon candidate', iconCandidate);
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

/**
 * icon source candidates must be square and at least 1024px
 * sorted by likelihood: likeliest candidate first
 */
async function iconSourceCandidates() {
    const candidates = [];
    const allImages = await findImages();
    for (const imagePath of allImages) {
        const info = await readImageInfo(imagePath);
        if (info.width === info.height && info.width > 1023) {
            candidates.push(imagePath);
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
        const info = await readImageInfo(imagePath);
        if (info.width === info.height && info.width > 1200) {
            candidates.push(imagePath);
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
    return new Promise((resolve) => {
        fs.createReadStream(imagePath).pipe(
            sharp()
                .on('info', function(info) {
                    resolve(info);
                })
        ).read();
    });
}

async function findImages() {
    return new Promise( (resolve, reject) => {
        glob('**/*+(.png|.jpg|.jpeg)', { nocase: true }, (err, files)=>{
            if(err) {
                reject(err);
            } else {
                resolve(files);
            }
        })
    });
}
