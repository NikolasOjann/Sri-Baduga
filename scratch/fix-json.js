const fs = require('fs');

const dataFile = 'backend/data/collections.json';
let raw = fs.readFileSync(dataFile, 'utf-8');

// Regex to find conflict blocks
const conflictRegex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n([\s\S]*?)>>>>>>> [^\n]+\r?\n/g;

raw = raw.replace(conflictRegex, (match, headBlock, friendBlock) => {
    // Both blocks usually contain lines of JSON properties like:
    // "gambar": null,
    // "id": 159,
    // "deskripsi_en": "..."
    // We want to combine them, preferring the friend's image if it's not null,
    // and keeping the translations from HEAD.

    // Let's parse them by wrapping in {}
    let headObj = {};
    let friendObj = {};
    
    try {
        // Fix trailing commas if they exist
        let h = headBlock.trim().replace(/,$/, '');
        let f = friendBlock.trim().replace(/,$/, '');
        headObj = JSON.parse(`{${h}}`);
        friendObj = JSON.parse(`{${f}}`);
    } catch(e) {
        console.error("Failed to parse blocks:", headBlock, friendBlock);
        return headBlock; // fallback
    }

    // Combine them
    const combined = { ...headObj, ...friendObj };
    // If friend has a real image, keep it. If friend has null but head has real, keep head.
    if (friendObj.gambar && friendObj.gambar !== "null") {
        combined.gambar = friendObj.gambar;
    } else if (headObj.gambar && headObj.gambar !== "null") {
        combined.gambar = headObj.gambar;
    }

    // Also keep deskripsi_en from HEAD if it exists and friend doesn't have it
    if (headObj.deskripsi_en && !friendObj.deskripsi_en) {
        combined.deskripsi_en = headObj.deskripsi_en;
    }

    // Convert back to string (without outer braces)
    const jsonStr = JSON.stringify(combined, null, 4);
    // Remove the first { and last }
    const innerLines = jsonStr.substring(jsonStr.indexOf('\n') + 1, jsonStr.lastIndexOf('\n'));
    
    return innerLines + '\n';
});

// Since the last property in an object might now need a comma, we don't have to worry because it replaces the inner properties.
// Wait, the conflict might replace the ENTIRE object or just inner properties?
// In our example, the conflict marker was INSIDE the object. So replacing it with inner properties is correct.

// Let's try to JSON parse the whole thing to verify
try {
    JSON.parse(raw);
    fs.writeFileSync(dataFile, raw, 'utf-8');
    console.log("JSON fixed successfully!");
} catch (e) {
    console.error("Still invalid JSON:", e.message);
    // write to a debug file just in case
    fs.writeFileSync('backend/data/collections-debug.json', raw, 'utf-8');
}
