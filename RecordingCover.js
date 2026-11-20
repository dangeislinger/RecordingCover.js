// ==UserScript== <nowiki>
// @name        Dialog Upload Script — Recording Cover Version
// @description Upload an recording cover using a dialog and automatically insert it into the article's infobox
// ==/UserScript==
(() => { 
// Single place to change the script version (used in the dialog link and the upload comment).
const SCRIPT_VERSION = 'v1.1.1';

mw.loader.using(['mediawiki.util']).then(() => {
    $(document).ready(() => {
        const link = mw.util.addPortletLink(
            'p-cactions',
            '#',
            'Upload Recording Cover'
        );

        $(link).on('click', e => {
            e.preventDefault();
            openUploadDialogRecording();
        });
    });
});

// ============================================================
// BUILDER: Create the non-free file description text
// ============================================================
function buildDescriptionText(article, author, source, date) {
	const descriptionText = "==Summary==\n" +
        "{{Non-free use rationale 2\n" +
        "|Description      = Official cover of the release [[" + article + "]]\n" +
        "|Source           = " + (source || "") + "\n" +
        "|Author           = " + (author || "") + "\n" +
        "|Article          = " + (article || "") + "\n" +
        "|Date             = "+ (date || "") + "\n" +
        "|Purpose          = to serve as the primary means of visual identification at the top of the article dedicated to the work in question.\n" +
        "|Replaceability   = Any derivative work based upon the cover art would be a copyright violation, so creation of a free image is not possible.\n" +
        "|Minimality       = This image is being used only once in the infobox of the named article and for purposes of identification only.\n" +
        "|Commercial       = The use of a low resolution image will not impact the commercial viability of the work.\n" +
        "}}\n" +
        "==Licensing==\n" +
        "{{Non-free album cover|image has rationale=yes}}\n";
	// console.log(descriptionText);
    return (descriptionText);
}

// ============================================================
// LOGIC: Update |cover= inside an Infobox
// ============================================================
function updateInfoboxCover(pageText, filename) {
    const startAlbumIndex = pageText.search(/\{\{\s*Infobox album\b/i);
    const startSongIndex = pageText.search(/\{\{\s*Infobox song\b/i);
	// console.log("startAlbumIndex = " + startAlbumIndex);
	// console.log("startSongIndex = " + startSongIndex);

	// If Infobox album not found, look for Infobox song
    if (startAlbumIndex === -1) {
		// If Infobox song not found, return pageText as is.
		if (startSongIndex === -1) {
			return pageText;
		// If Infobox song is found, find and replace |cover=
		} else {
			const songFinalText = updateSongInfoboxCover(pageText, filename);
// console.log("songFinalText = " + songFinalText);
			return songFinalText;
		}
	// If Infobox album is found, find and replace |cover=
	} else {
		const albumFinalText = updateAlbumInfoboxCover(pageText, filename);
// console.log("albumFinalText = " + albumFinalText);
		return albumFinalText;
	}
}

// ============================================================
// Insert or update |cover= inside an album Infobox
// ============================================================
function updateAlbumInfoboxCover(pageText, filename) {

    const coverLine = `| cover         = ${filename}`;

    // -----------------------------------------------------
    // 1) Find Infobox album start
    // -----------------------------------------------------
    const startIndex = pageText.search(/\{\{\s*Infobox album\b/i);

    if (startIndex === -1) {
        return pageText;
    }

    // -----------------------------------------------------
    // 2) Extract the whole template safely
    // -----------------------------------------------------
    let braceCount = 0;
    let endIndex = -1;

    for (let i = startIndex; i < pageText.length; i++) {
        if (pageText[i] === '{' && pageText[i+1] === '{') braceCount++;
        if (pageText[i] === '}' && pageText[i+1] === '}') braceCount--;

        if (braceCount === 0) {
            endIndex = i + 2;
            break;
        }
    }

    if (endIndex === -1) {
        console.log("ERROR: Could not find end of Infobox album template.");
        return pageText; // Fail safe
    }

    const infobox = pageText.substring(startIndex, endIndex);

    let updatedInfobox = infobox;

    // -----------------------------------------------------
    // 3) Replace or insert |cover=
    // -----------------------------------------------------
    if (/^\s*\|\s*cover\s*=.*$/mi.test(infobox)) {
        updatedInfobox = infobox.replace(
            /^\s*\|\s*cover\s*=.*$/mi,
            coverLine
        );
    } else {
        updatedInfobox = infobox.replace(
            /(\{\{\s*Infobox album[^\n]*\n)/i,
            `$1${coverLine}\n`
        );
    }

    // -----------------------------------------------------
    // 4) Put updated infobox back in page text
    // -----------------------------------------------------
    const before = pageText.substring(0, startIndex);
    const after = pageText.substring(endIndex);

    const finalText = before + updatedInfobox + after;
    return finalText;
}

// ============================================================
// LOGIC: Update |cover= inside a Song Infobox
// ============================================================
function updateSongInfoboxCover(pageText, filename) {

    const coverLine = `| cover         = ${filename}`;

    // -----------------------------------------------------
    // 1) Find Infobox song start
    // -----------------------------------------------------
    const startIndex = pageText.search(/\{\{\s*Infobox song\b/i);

    if (startIndex === -1) {
        return pageText;
    }

    // -----------------------------------------------------
    // 2) Extract the whole template safely
    // -----------------------------------------------------
    let braceCount = 0;
    let endIndex = -1;

    for (let i = startIndex; i < pageText.length; i++) {
        if (pageText[i] === '{' && pageText[i+1] === '{') braceCount++;
        if (pageText[i] === '}' && pageText[i+1] === '}') braceCount--;

        if (braceCount === 0) {
            endIndex = i + 2;
            break;
        }
    }

    if (endIndex === -1) {
        console.log("ERROR: Could not find end of Infobox song template.");
        return pageText; // Fail safe
    }

    const infobox = pageText.substring(startIndex, endIndex);

    let updatedInfobox = infobox;

    // -----------------------------------------------------
    // 3) Replace or insert |cover=
    // -----------------------------------------------------
    if (/^\s*\|\s*cover\s*=.*$/mi.test(infobox)) {
        updatedInfobox = infobox.replace(
            /^\s*\|\s*cover\s*=.*$/mi,
            coverLine
        );
    } else {
        updatedInfobox = infobox.replace(
            /(\{\{\s*Infobox song[^\n]*\n)/i,
            `$1${coverLine}\n`
        );
    }

    // -----------------------------------------------------
    // 4) Put updated infobox back in page text
    // -----------------------------------------------------
    const before = pageText.substring(0, startIndex);
    const after = pageText.substring(endIndex);

    const finalText = before + updatedInfobox + after;
    return finalText;
}

// ============================================================
// NETWORK: Upload file using MediaWiki API
// ============================================================
// ============================================================
// NETWORK: After upload, fetch wikitext, insert image, save
// ============================================================
// Returns true if the article was edited and saved, false otherwise.
// (The page reload now happens in the Upload handler, after all steps finish.)
async function updateInfobox(api, article, filename, addInfobox) {
    let pageText;

    // Step 1: Fetch page text
    try {
        const result = await api.get({
            action: "query",
            prop: "revisions",
            rvprop: "content",
            titles: article,
            formatversion: 2
        });

        pageText = result.query.pages[0].revisions[0].content;

    } catch (e) {
        mw.notify("Failed to fetch article text.", { type: "error" });
        throw e;
    }

    // Step 2: Update infobox cover (if checkbox is checked)
    if (addInfobox) {
        const updatedText = updateInfoboxCover(pageText, filename);
		// console.log("updatedText = " + updatedText);

        if (!updatedText) {
            mw.notify("No infobox found — skipping article edit.", { type: "warn" });
            return false;
        }

        // Step 3: Save wikitext
        try {
            await api.edit(article, () => ({
                text: updatedText,
                summary: "Add recording cover to infobox (script upload via [[User:Widgetkid/RecordingCover.js]])"
            }));

            mw.notify("Infobox updated successfully! Reloading…");
            return true;

        } catch (e) {
            mw.notify("Failed to update article text.", { type: "error" });
            throw e;
        }
    } else {
        mw.notify("Infobox update skipped.", { type: "info" });
        return false;
    }
}

// ============================================================
// REMOVE NEEDS-INFOBOX TAGS (helpers)
// ============================================================

// Given the index of an opening "{{", return the index just past its matching "}}"
// (nested templates included), or -1 if the template is never closed.
function findTemplateEnd(text, start) {
    let depth = 0;
    let i = start;
    while (i < text.length) {
        if (text.startsWith('{{', i)) {
            depth++;
            i += 2;
        } else if (text.startsWith('}}', i)) {
            depth--;
            i += 2;
            if (depth === 0) return i;
        } else {
            i++;
        }
    }
    return -1;
}

// Remove text.slice(start, end). If what's left of that line would be blank,
// remove the whole line (including its line break) instead.
// Returns the new text and the index where the text following the cut now begins.
function cutMatch(text, start, end) {
    const lineStart = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = text.indexOf('\n', end);
    const hasNewline = lineEnd !== -1;
    if (!hasNewline) lineEnd = text.length;

    const aloneOnLine = text.slice(lineStart, start).trim() === '' &&
                        text.slice(end, lineEnd).trim() === '';
    if (aloneOnLine) {
        return {
            text: text.slice(0, lineStart) + text.slice(hasNewline ? lineEnd + 1 : lineEnd),
            pos: lineStart
        };
    }
    return { text: text.slice(0, start) + text.slice(end), pos: start };
}

// Finds and removes every needs-infobox tag in the given talk page wikitext:
//   |needs-infobox=yes   |needs-infobox=y
//   {{Infobox requested}}  {{Infobox requested|...}}
//   {{Reqinfobox}}         {{Reqinfobox|...}}
// Matching is case-insensitive, tolerates spaces/underscores and whitespace
// around "|" and "=", and treats template parameters (including nested
// templates) as part of the match. Returns { text, removed }, where removed
// lists the exact text removed by each match.
function removeNeedsInfoboxTags(text) {
    const removed = [];
    let searchFrom;

    // 1) Templates: {{Infobox requested...}} and {{Reqinfobox...}}
    const templateStart = /\{\{[ \t\r\n]*(?:Infobox[ _]+requested|Reqinfobox)[ \t\r\n]*(?=\||\}\})/gi;
    searchFrom = 0;
    while (true) {
        templateStart.lastIndex = searchFrom;
        const m = templateStart.exec(text);
        if (!m) break;
        const end = findTemplateEnd(text, m.index);
        if (end === -1) {            // Unclosed template: leave it alone
            searchFrom = m.index + m[0].length;
            continue;
        }
        removed.push(text.slice(m.index, end));
        const cut = cutMatch(text, m.index, end);
        text = cut.text;
        searchFrom = cut.pos;
    }

    // 2) Banner parameters: |needs-infobox=yes and |needs-infobox=y (whole values only)
    const flagPattern = /\|[ \t]*needs-infobox[ \t]*=[ \t]*(?:yes|y)(?!\w)/gi;
    searchFrom = 0;
    while (true) {
        flagPattern.lastIndex = searchFrom;
        const m = flagPattern.exec(text);
        if (!m) break;
        removed.push(m[0]);
        const cut = cutMatch(text, m.index, m.index + m[0].length);
        text = cut.text;
        searchFrom = cut.pos;
    }

    return { text: text, removed: removed };
}

// Tells the user what was (or wasn't) removed.
function notifyNeedsInfoboxResults(removed) {
    if (!removed.length) {
        mw.notify('No needs-infobox tags found on the Talk page.', { type: 'info' });
        return;
    }
    console.log('Removed needs-infobox matches:', removed);
    const $msg = $('<div>');
    $('<p>').text('Removed ' + removed.length + ' needs-infobox match' +
        (removed.length === 1 ? '' : 'es') + ' from the Talk page:').appendTo($msg);
    const $list = $('<ul>').appendTo($msg);
    removed.forEach(str => {
        $('<li>').append($('<code>').css('white-space', 'pre-wrap').text(str)).appendTo($list);
    });
    mw.notify($msg, { type: 'success', autoHideSeconds: 'long' });
}

// ============================================================
// REMOVE FLAGS
// ============================================================
// Removes the imageneeded flag and/or needs-infobox tags from the article's Talk
// page in a single fetch and a single edit. Returns { removedCount } (the number
// of needs-infobox matches that were removed and saved).
async function removeProjectFlags(article, removeImageNeeded, removeNeedsInfobox) {
    const baseTitle = article || mw.config.get('wgPageName').replace(/_/g, ' ');
    const talkPageTitle = 'Talk:' + baseTitle;
    const api = new mw.Api();
    const outcome = { removedCount: 0 };

    try {
        // Step 1: Fetch the talk page content
        const result = await api.get({
            action: "query",
            prop: "revisions",
            rvprop: "content",
            rvslots: "main",
            titles: talkPageTitle,
            formatversion: 2
        });

        const page = result.query && result.query.pages && result.query.pages[0];
        if (!page || page.invalid) {
            mw.notify('Unable to look up the Talk page.', { type: 'error' });
            return outcome;
        }
        if (page.missing) {
            mw.notify('Talk page does not exist; nothing to remove.', { type: 'info' });
            return outcome;
        }
        const revision = page.revisions && page.revisions[0];
        const pageText = revision && (revision.slots && revision.slots.main
            ? revision.slots.main.content : revision.content);
        if (typeof pageText !== 'string') {
            mw.notify('Talk page content not found.', { type: 'error' });
            return outcome;
        }
        if (/^\s*#REDIRECT\b/i.test(pageText)) {
            mw.notify('Talk page is a redirect; flag removal skipped.', { type: 'info' });
            return outcome;
        }

        // Step 2: Remove the requested flags
        let updatedPageText = pageText;

        // Remove the imageneeded flag if it exists
        let imageNeededChanged = false;
        if (removeImageNeeded) {
            updatedPageText = updatedPageText.replace(/\|imageneeded=[^|}]*\s*/g, '');
            updatedPageText = updatedPageText.replace(/\| imageneeded=[^|}]*\s*/g, '');
            imageNeededChanged = updatedPageText !== pageText;
        }

        // Remove needs-infobox tags if requested
        let removed = [];
        if (removeNeedsInfobox) {
            const r = removeNeedsInfoboxTags(updatedPageText);
            updatedPageText = r.text;
            removed = r.removed;
        }

        // Step 3: Save the updated content back to the talk page (only if something changed)
        if (updatedPageText !== pageText) {
            const summaryParts = [];
            if (imageNeededChanged) summaryParts.push('Removed unnecessary flags from banner');
            if (removed.length) summaryParts.push(imageNeededChanged
                ? 'removed needs-infobox tag(s)' : 'Removed needs-infobox tag(s)');
            const summary = removed.length
                ? summaryParts.join('; ') + ' (scripted edit via [[User:Widgetkid/RecordingCover.js|RecordingCover]])'
                : 'Removed unnecessary flags from banner (script upload via [[User:Widgetkid/RecordingCover.js]])';

            try {
                await api.edit(talkPageTitle, () => ({
                    text: updatedPageText,
                    summary: summary
                }));
            } catch (e) {
                mw.notify('Error editing the talk page.', { type: 'error' });
                throw e;
            }
            outcome.removedCount = removed.length;
        }

        // Step 4: Report the results
        if (removeImageNeeded) {
            mw.notify(imageNeededChanged ? 'imageneeded flag removed successfully!'
                : 'No imageneeded flag found to remove.', { type: 'info' });
        }
        if (removeNeedsInfobox) {
            notifyNeedsInfoboxResults(removed);
        }
    } catch (error) {
        console.error('Error:', error);
        mw.notify('Error removing flags from talk page.', { type: 'error' });
    }
    return outcome;
}

// ============================================================
// UI: DIALOG + UPLOAD HANDLER
// ============================================================

const pdTags = ['{{PD-US-expired}}', '{{PD-textlogo}}', '{{PD-simple}}', '{{PD-US-no notice}}'];

// ============================================================
// NEW PRESETS
// To add a new preset, add one more object to this array.
//   label  - text shown in the Preset drop-down
//   author - fills "Author / copyright holder"
//   pdTag  - must match one of the PD Tag drop-down options (see pdTags above);
//            if it doesn't match, the PD Tag selection is left unchanged
//   basis  - fills "PD Tag Basis"
// Picking a preset also checks the Public Domain checkbox.
// ============================================================
const presets = [
    {
        label: "Brunswick Records 'B' shield & scrollwork",
        author: "Brunswick Records",
        pdTag: "{{PD-US-expired}}",
        basis: "Published in 1924, so its U.S. copyright term has expired."
    },
    {
        label: "Buena Vista Records Stylized text",
        author: "Buena Vista Records",
        pdTag: "{{PD-simple}}",
        basis: "Consists only of simple geometric shapes and lettering below the threshold of originality."
    },
    {
        label: "Capitol Records Dome",
        author: "Capitol Records",
        pdTag: "{{PD-US-no notice}}",
        basis: "Published in 1953 in the U.S. without a required copyright notice."
    },
    {
        label: "Columbia Records Music notes logos",
        author: "Columbia Records",
        pdTag: "{{PD-simple}}",
        basis: "Composed of basic musical note forms and simple shapes lacking copyrightable authorship."
    },
    {
        label: "Columbia Records Walking eye logo",
        author: "Columbia Records",
        pdTag: "{{PD-simple}}",
        basis: "Uses simple graphic shapes and lines that do not meet the threshold of originality."
    },
    {
        label: "Decca Records Stylized text logo",
        author: "Decca Records",
        pdTag: "{{PD-textlogo}}",
        basis: "Consists solely of stylized text/wordmark elements ineligible for copyright protection."
    },
    {
        label: "Epic Records Radial starburst",
        author: "Epic Records",
        pdTag: "{{PD-simple}}",
        basis: "Formed from basic radial lines and simple geometric elements below the originality threshold."
    },
    {
        label: "Epic Records Scripted text",
        author: "Epic Records",
        pdTag: "{{PD-simple}}",
        basis: "Consists of basic scripted lettering and simple strokes without copyrightable creative expression."
    },
    {
        label: "RCA Records Stylized text logo",
        author: "RCA Records",
        pdTag: "{{PD-textlogo}}",
        basis: "Comprises a stylized text wordmark that is not eligible for copyright."
    },
    {
        label: "RCA Records Stylized text with lightning",
        author: "RCA Records",
        pdTag: "{{PD-simple}}",
        basis: "Combines simple lettering with basic lightning bolt shapes lacking sufficient originality."
    },
    {
        label: "Savoy Records Hand drawn musicians",
        author: "Savoy Records",
        pdTag: "{{PD-US-no notice}}",
        basis: "Published in the U.S. in the 1940s without a valid copyright notice."
    },
    {
        label: "Savoy Records Music note logo",
        author: "Savoy Records",
        pdTag: "{{PD-simple}}",
        basis: "Relies on a basic music note motif and simple shapes below the originality threshold."
    },
    {
        label: "Tower Records Logo",
        author: "Tower Records",
        pdTag: "{{PD-simple}}",
        basis: "Made up of simple geometric forms and text below the threshold of originality."
    },
    {
        label: "United Artists Records Stylized UA logo",
        author: "United Artists Records",
        pdTag: "{{PD-simple}}",
        basis: "Uses simple initials and basic geometric styling without copyrightable originality."
    },
    {
        label: "Verve Records Stylized text logo",
        author: "Verve Records",
        pdTag: "{{PD-simple}}",
        basis: "Consists of simple stylized lettering below the threshold of copyright protection."
    },
    {
        label: "Victor / RCA Victor Dog (Nipper)",
        author: "Victor / RCA Victor",
        pdTag: "{{PD-US-expired}}",
        basis: "Based on an 1899 work whose U.S. copyright term has expired."
    }
];

function commonsField(value) {
    return '<nowiki>' + String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</nowiki>';
} // <nowiki>
function coverDescription(article) { return 'Cover art for ' + article + '.'; }
function buildCommonsDescriptionText(article, author, source, date, tag, basis) {
    return '==Summary==\n{{Information\n|description={{en|1=' + commonsField(coverDescription(article)) + '}}\n' +
        '|date=' + commonsField(date) + '\n|source=' + commonsField(source) +
        '\n|author=' + commonsField(author) + '\n|permission=\n|other_versions=\n' +
        '|other_fields={{Information field|name=PD Tag Basis|value=' + commonsField(basis) + '}}\n}}\n' +
        '==Licensing==\n' + tag + '\n';
}
async function setEnglishCaption(api, filename, caption) {
    const result = await api.get({ action: 'query', prop: 'info', titles: 'File:' + filename, formatversion: 2 });
    const page = result.query.pages[0];
    if (!page || !page.pageid || page.missing) throw new Error('Uploaded file page could not be found.');
    await api.postWithToken('csrf', {
        action: 'wbsetlabel', id: 'M' + page.pageid, language: 'en', value: caption,
        summary: 'Set English recording-cover caption', assert: 'user'
    });
}
function uploadChecked(api, fileInput, filename, text) {
    return new Promise((resolve, reject) => {
        api.upload(fileInput, { filename: filename, text: text,
            comment: 'Uploaded via userscript User:Widgetkid/RecordingCover.js ' + SCRIPT_VERSION, assert: 'user'
        }).done(resolve).fail((code, result) => {
            if (result && result.upload) resolve(result);
            else reject(new Error((result && result.error && result.error.info) || code || 'Upload failed'));
        });
    });
}

// ============================================================
// NETWORK: Create the English Wikipedia File talk page after upload
// ============================================================
async function createFileTalkPage(api, article, filename) {
    const talkTitle = 'File talk:' + filename;
    const existing = await api.get({
        action: 'query', prop: 'info', titles: talkTitle, formatversion: 2
    });
    const talkPage = existing.query && existing.query.pages && existing.query.pages[0];
    if (!talkPage || talkPage.invalid) throw new Error('Unable to check the File talk page.');
    if (!talkPage.missing) {
        mw.notify('File talk page already exists; left untouched: ' + talkTitle, { type: 'info' });
        return;
    }

    const result = await api.get({
        action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main',
        titles: article, formatversion: 2
    });
    const page = result.query && result.query.pages && result.query.pages[0];
    const revision = page && page.revisions && page.revisions[0];
    const pageText = revision && revision.slots && revision.slots.main && revision.slots.main.content;
    if (typeof pageText !== 'string') throw new Error('Unable to read the article for album/song detection.');
    // Ignore comments and nowiki examples when detecting the article infobox.
    const detectionText = pageText.replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<nowiki\b[^>]*>[\s\S]*?<\/nowiki\s*>/gi, '');
    const project = /\{\{\s*Infobox album\b/i.test(detectionText) ? 'Albums'
        : /\{\{\s*Infobox song\b/i.test(detectionText) ? 'Songs' : null;
    if (!project) {
        mw.notify('No album or song infobox found; File talk page creation skipped.', { type: 'info' });
        return;
    }
    const text = '{{WikiProject banner shell|\n{{WikiProject ' + project + '}}\n}}';
    try {
        // createonly also protects a page created after the existence check.
        const edit = await new Promise((resolve, reject) => {
            api.postWithToken('csrf', {
                action: 'edit', title: talkTitle, text: text, createonly: true,
                assert: 'user', formatversion: 2,
                summary: 'Create file talk page with WikiProject ' + project +
                    ' banner (script upload via [[User:Widgetkid/RecordingCover.js]])'
            }).done(resolve).fail((code, details) => reject({ code: code, details: details }));
        });
        if (!edit.edit || edit.edit.result !== 'Success') {
            throw new Error('The API did not confirm File talk page creation.');
        }
        mw.notify('File talk page created: ' + talkTitle, { type: 'success' });
    } catch (error) {
        if (error.code === 'articleexists') {
            mw.notify('File talk page already exists; left untouched: ' + talkTitle, { type: 'info' });
            return;
        }
        throw error;
    }
}

function openUploadDialogRecording() {

    mw.loader.using(['jquery.ui', 'mediawiki.api', 'mediawiki.ForeignApi']).then(() => {

        const articleTitle =
            mw.config.get('wgNamespaceNumber') === 0
                ? mw.config.get('wgPageName').replace(/_/g, ' ')
                : '';

        const $dialog = $(`
            <div title="Upload Recording Cover">

                <p style="margin-top:1em;"><b>Article Title:</b></p>
                <input id="upload-article" type="text" style="width:100%;" value="">

                <p style="margin-top:1em;"><b>Source of the file:</b></p>
                <input id="upload-source" type="text" style="width:100%;">

                <p style="margin-top:1em;"><b>Preset:</b></p>
                <select id="upload-preset" style="width:100%;">
                    <option value=""></option>
                </select>

                <p style="margin-top:1em;"><b>Author / copyright holder (Artist or Label):</b></p>
                <input id="upload-author" type="text" style="width:100%;">
                
                <p style="margin-top:1em;"><b>Date of Publication:</b></p>
                <input id="date" type="text" style="width:100%;">

                <p style="display:flex; align-items:center; gap:0.5em; flex-wrap:wrap;">
                    <input type="checkbox" id="upload-public-domain">
                    <label for="upload-public-domain">Public Domain</label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <select id="upload-pd-tag" disabled>
                        <option value=""></option>
                        <option value="{{PD-US-expired}}">{{PD-US-expired}}</option>
                        <option value="{{PD-textlogo}}">{{PD-textlogo}}</option>
                        <option value="{{PD-simple}}">{{PD-simple}}</option>
                        <option value="{{PD-US-no notice}}">{{PD-US-no notice}}</option>
                    </select>
                    <label for="upload-pd-tag">PD Tag</label>
                </p>
                <p><label for="upload-pd-basis">PD Tag Basis</label></p>
                <input id="upload-pd-basis" type="text" style="width:100%;" disabled>
                <p><a href="https://en.wikipedia.org/wiki/Wikipedia:File_copyright_tags/Public_domain"
                    target="_blank" rel="noopener noreferrer">Public domain tag reference</a></p>

                <p style="margin-top:1em;"><b>Select file:</b></p>
                <input id="upload-file" type="file">
                
                <p style="margin-top:1em;" id="new_file_name" type="text"></p>

                <p style="margin-top:1em;">
                    <input type="checkbox" id="add-infobox-recording" checked>
                    <label for="add-infobox-recording">Add image to the album or song Infobox?</label>
                </p>
                
                <p style="margin-top:1em;">
                    <input type="checkbox" id="cb_imageneeded-flag" checked>
                    <label for="cb_imageneeded-flag">Remove 'imageneeded' flag (albums only)?</label>
                </p>

                <p style="margin-top:1em;">
                    <input type="checkbox" id="cb_needsinfobox-flag" checked>
                    <label for="cb_needsinfobox-flag">Remove needs-infobox tag from Talk page?</label>
                </p>

				<p style="margin-top:1em; text-align: right;">
                    <small><a href="https://en.wikipedia.org/wiki/User:Widgetkid/RecordingCover#Change_log" target="_blank" rel="noopener noreferrer">${SCRIPT_VERSION}</a></small>
                </p>

            </div>
        `);

        $dialog.find('#upload-article').val(articleTitle);

        // Build the Preset drop-down from the presets array.
        // .text() is used so quotes and ampersands in labels display correctly.
        presets.forEach((preset, index) => {
            $('<option>').val(String(index)).text(preset.label).appendTo($dialog.find('#upload-preset'));
        });

        $('body').append($dialog);
        let busy = false;
        function syncPDFields() {
            const enabled = $dialog.find('#upload-public-domain').is(':checked');
            const tagSelected = Boolean($dialog.find('#upload-pd-tag').val());
            $dialog.find('#upload-pd-tag').prop('disabled', !enabled).prop('required', enabled);
            $dialog.find('#upload-pd-basis').prop('disabled', !enabled).prop('required', enabled && tagSelected);
        }
        $dialog.on('change', '#upload-public-domain, #upload-pd-tag', syncPDFields);
        syncPDFields();

        // Apply a preset. Selecting the blank option leaves all fields as they are.
        $dialog.on('change', '#upload-preset', function () {
            const value = $(this).val();
            if (value === '') return;
            const preset = presets[Number(value)];
            if (!preset) return;

            // 1. Author / copyright holder
            $dialog.find('#upload-author').val(preset.author);

            // 2. Public Domain checkbox (sync first so the PD fields are enabled)
            $dialog.find('#upload-public-domain').prop('checked', true);
            syncPDFields();

            // 3. PD Tag (only if the tag exists in the drop-down; otherwise unchanged)
            const $pdTag = $dialog.find('#upload-pd-tag');
            const tagExists = $pdTag.find('option').filter(function () {
                return this.value === preset.pdTag;
            }).length > 0;
            if (tagExists) $pdTag.val(preset.pdTag);

            // 4. PD Tag Basis
            $dialog.find('#upload-pd-basis').val(preset.basis);

            // Refresh the required flags now that the tag may have changed
            syncPDFields();
        });

        $dialog.dialog({
            width: 500,
            modal: true,
            closeOnEscape: true,
            autoOpen: true,
            // NEW: Put the cursor in the Source of the file field when the form opens.
            open: () => { $dialog.find('#upload-source').trigger('focus'); },
            close: () => $dialog.remove(),
            buttons: {

                "Upload": async function () {

                    if (busy) return;
                    const field = id => $dialog.find('#' + id);
                    const fileInput = field('upload-file')[0];
                    const file = fileInput.files[0];
                    const article = field('upload-article').val().trim();
                    const author = field('upload-author').val().trim();
                    const source = field('upload-source').val().trim();
                    const date = field('date').val().trim();
                    const isPD = field('upload-public-domain').is(':checked');
                    const pdTag = field('upload-pd-tag').val();
                    const basis = field('upload-pd-basis').val().trim();
                    const addInfobox = field('add-infobox-recording').is(':checked');
                    const removeImageNeeded = field('cb_imageneeded-flag').is(':checked');
                    const removeNeedsInfobox = field('cb_needsinfobox-flag').is(':checked');
                    if (isPD && !pdTags.includes(pdTag)) {
                        mw.notify('PD Tag required for Public Domain files.', { type: 'error' }); return;
                    }
                    if (isPD && !basis) {
                        mw.notify('PD Tag Basis required for Public Domain files.', { type: 'error' }); return;
                    }
                    if (isPD && !source) {
                        mw.notify('Source required for Public Domain files.', { type: 'error' }); return;
                    }
                    if (!file) { mw.notify('No file selected!', { type: 'error' }); return; }
                    const extension = (file.type.includes('image/')
                        ? file.type.split('/').pop() : file.name.split('.').pop()).toLowerCase();
                    const filename = `${article} (Recording Cover).${extension}`
                        .replace(/[#<>\[\]|:{}/]+|~{3,}/g, ' -');
                    const api = new mw.Api();
                    const uploadApi = isPD ? new mw.ForeignApi('https://commons.wikimedia.org/w/api.php') : api;
                    const descriptionText = isPD
                        ? buildCommonsDescriptionText(article, author, source, date, pdTag, basis)
                        : buildDescriptionText(article, author, source, date);
                    busy = true;
                    const $buttons = $dialog.dialog('widget').find('.ui-dialog-buttonpane button');
                    $buttons.prop('disabled', true);
                    try {
                        let result;
                        try {
                            result = await uploadChecked(uploadApi, fileInput, filename, descriptionText);
                        } catch (err) {
                            console.error(err);
                            mw.notify('Error during upload: ' + err.message +
                                '. Article and talk page were not changed.', { type: 'error' }); return;
                        }
                        const upload = result && result.upload;
                        if (upload && upload.warnings) {
                            mw.notify('Upload warnings: ' + JSON.stringify(upload.warnings), { type: 'warn' });
                        }
                        if (!upload || upload.result !== 'Success' || !upload.filename) {
                            mw.notify('Upload not completed. Article and talk page were not changed. Resolve any warnings before trying again.',
                                { type: 'error' }); return;
                        }
                        const uploadedFilename = upload.filename;
                        field('new_file_name').text('Uploaded File: ' + uploadedFilename);
                        mw.notify('File uploaded to ' + (isPD ? 'Wikimedia Commons: ' : 'Wikipedia: ') + uploadedFilename);
                        if (isPD) {
                            try {
                                await setEnglishCaption(uploadApi, uploadedFilename, coverDescription(article));
                            } catch (err) {
                                console.error(err);
                                mw.notify('File uploaded, but the English caption could not be saved. Add it manually: ' +
                                    coverDescription(article), { type: 'warn' });
                            }
                        }
                        try {
                            await createFileTalkPage(api, article, uploadedFilename);
                        } catch (err) {
                            console.error(err);
                            mw.notify('File uploaded, but the File talk page could not be created. Continuing with article updates.',
                                { type: 'warn' });
                        }
                        try {
                            const articleEdited = await updateInfobox(api, article, uploadedFilename, addInfobox);
                            let talkRemovals = 0;
                            if (removeImageNeeded || removeNeedsInfobox) {
                                talkRemovals = (await removeProjectFlags(article, removeImageNeeded, removeNeedsInfobox)).removedCount;
                            }
                            // Reload only after every step has finished. Wait longer when the
                            // removed-content notification needs time to be read.
                            if (articleEdited) {
                                setTimeout(() => { location.reload(); }, talkRemovals ? 10000 : 4000);
                            }
                        } catch (err) {
                            console.error(err);
                            mw.notify('File uploaded, but an article or talk-page update failed.', { type: 'error' });
                        }
                    } finally {
                        busy = false;
                        $buttons.prop('disabled', false);
                    }

                },

                Cancel: function () {
                    $(this).dialog("close");
                }
            }
        });
    });
}


// Commenting out date_warning function. Was creating error messages and isn't critical.	
//	function date_warning(){
//		const date = $("#date").val().trim();
//		if (date<1930)
//		{$('#date_warning').text("As the cover is published before 1930, are you sure that the file is not in public domain, and hence, cannot be uploaded to Wikipedia Commons? Please proceed with caution.");}
//	}

})();
// </nowiki>
