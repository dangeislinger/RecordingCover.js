// ==UserScript==
// @name        Dialog Upload Script — Recording Cover Version
// @description Upload an recording cover using a dialog and automatically insert it into the article's infobox
// ==/UserScript==
(() => { 
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

    const coverLine = `| cover = ${filename}`;

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

    const coverLine = `| cover = ${filename}`;

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
            return;
        }

        // Step 3: Save wikitext
        try {
            await api.edit(article, () => ({
                text: updatedText,
                summary: "Add recording cover to infobox (script upload via [[User:Widgetkid/RecordingCover.js]])"
            }));

            mw.notify("Infobox updated successfully! Reloading…");

            // 👇 RELOAD HERE
            setTimeout(() => {
                location.reload();
            }, 4000);

        } catch (e) {
            mw.notify("Failed to update article text.", { type: "error" });
            throw e;
        }
    } else {
        mw.notify("Infobox update skipped.", { type: "info" });
    }
}

// ============================================================
// REMOVE FLAGS
// ============================================================
async function removeProjectFlags(removeImageNeeded) {
    const articleTitle = mw.config.get('wgPageName');  // Get the article's title
	// console.log("articleTitle = " + articleTitle);
    const talkPageTitle = 'Talk:' + articleTitle;       // Construct the talk page title
	// console.log("talkPageTitle = " + talkPageTitle);
    const api = new mw.Api();

    try {
        // Step 1: Fetch the talk page content
        const result = await api.get({
            action: "query",
            prop: "revisions",
            rvprop: "content",
            titles: talkPageTitle,   // Make sure to fetch the talk page
            formatversion: 2
        });

        // Check if we got valid data back
        if (!result.query || !result.query.pages) {
            mw.notify('Talk page content not found.', { type: 'error' });
            return;
        }

        const pageText = result.query.pages[0].revisions[0].content;
		// console.log("pageText = " + pageText);

        // Step 2: Remove the flags from the WikiProject Albums template
        let updatedPageText = pageText;

        // Remove the imageneeded flag if it exists
        if (removeImageNeeded)
        	updatedPageText = updatedPageText.replace(/\|imageneeded=[^|}]*\s*/g, '');
			// console.log("updatedPageText 1= " + updatedPageText);
        	updatedPageText = updatedPageText.replace(/\| imageneeded=[^|}]*\s*/g, '');
			// console.log("updatedPageText 2= " + updatedPageText);

			const flagCounter = pageText.indexOf("| imageneeded=")
			// console.log("flagCounter= " + flagCounter);
			
			// Step 3: Save the updated content back to the talk page
				
			if (updatedPageText !== pageText && flagCounter > 0) {

				try {
					await api.edit(talkPageTitle, () => ({
						text: updatedPageText,
						summary: "Removed unnecessary flags from banner (script upload via [[User:Widgetkid/RecordingCover.js]])"
					}));

					mw.notify("Flags removed successfully! Reloading…");

				}

				// Debug: Log the edit result

				catch (e) {
					mw.notify('Error editing the talk page.', { type: 'error' });
					throw e;
				}

			} else {
				mw.notify('No flags found to remove.', { type: 'info' });
        }
    } catch (error) {
        console.error('Error:', error);
        mw.notify('Error removing flags from talk page.', { type: 'error' });
    }
}

// ============================================================
// UI: DIALOG + UPLOAD HANDLER
// ============================================================

const pdTags = ['{{PD-US-expired}}', '{{PD-textlogo}}', '{{PD-simple}}', '{{PD-US-no notice}}'];
function commonsField(value) {
    return '<nowiki>' + String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</nowiki>';
}
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
            comment: 'Uploaded via userscript User:Widgetkid/RecordingCover.js', assert: 'user'
        }).done(resolve).fail((code, result) => {
            if (result && result.upload) resolve(result);
            else reject(new Error((result && result.error && result.error.info) || code || 'Upload failed'));
        });
    });
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

                <p style="margin-top:1em;"><b>Author / copyright holder (Artist or Label):</b></p>
                <input id="upload-author" type="text" style="width:100%;">

                <p style="margin-top:1em;"><b>Source of the file:</b></p>
                <input id="upload-source" type="text" style="width:100%;">
                
                <p style="margin-top:1em;"><b>Date of Publication:</b></p>
                <input id="date" type="text" style="width:100%;">

                <p style="display:flex; align-items:center; gap:0.5em; flex-wrap:wrap;">
                    <input type="checkbox" id="upload-public-domain">
                    <label for="upload-public-domain">Public Domain</label>
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

				<p style="margin-top:1em; text-align: right;">
                    <small>v1.0.8</small>
                </p>

            </div>
        `);

        $dialog.find('#upload-article').val(articleTitle);
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

        $dialog.dialog({
            width: 500,
            modal: true,
            closeOnEscape: true,
            autoOpen: true,
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
                            await updateInfobox(api, article, uploadedFilename, addInfobox);
                            if (removeImageNeeded) await removeProjectFlags(removeImageNeeded);
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
