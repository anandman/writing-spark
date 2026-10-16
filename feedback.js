// Local-only feedback for a parent to export and review in a future coding session.
const FEEDBACK_STORAGE_KEY = 'writing-spark-feedback-v1';
let feedbackData = { schemaVersion: 1, missingWords: [], ideaFeedback: [] };
let feedbackStorageReadable = true;
let feedbackPersistent = true;
let currentIdeaForFeedback = null;
let currentFeedbackIndex = null;

function initializeFeedback() {
    try {
        const saved = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
        if (saved !== null) {
            const data = JSON.parse(saved);
            if (!validFeedbackData(data)) throw new Error('Unrecognized feedback data');
            feedbackData = data;
        }
    } catch (_) {
        // Leave unreadable data untouched. New feedback can still be exported.
        feedbackStorageReadable = false;
        feedbackPersistent = false;
    }
    updateFeedbackPanel();
}

function validFeedbackData(data) {
    const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
    return data?.schemaVersion === 1 && Array.isArray(data.missingWords) && Array.isArray(data.ideaFeedback)
        && data.missingWords.every(record => record && typeof record.input === 'string'
            && /^\p{Script=Han}+$/u.test(record.input) && Number.isSafeInteger(record.count) && record.count > 0
            && date(record.firstSeen) && date(record.lastSeen))
        && data.ideaFeedback.every(record => record && ['chinese', 'english'].includes(record.mode)
            && typeof record.input === 'string' && typeof record.word === 'string'
            && typeof record.idea === 'string' && record.idea.length > 0
            && ['helpful', 'not-helpful', null].includes(record.rating)
            && typeof record.note === 'string' && record.note.length <= 500
            && date(record.createdAt) && date(record.updatedAt));
}

function feedbackSaveMessage() {
    return feedbackPersistent
        ? 'Saved on this device.'
        : 'Saved for this visit only. Download the report before closing this page.';
}

function persistFeedback() {
    feedbackPersistent = false;
    if (feedbackStorageReadable) {
        try {
            window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbackData));
            feedbackPersistent = true;
        } catch (_) {
            // Storage can be blocked or full. Keep the in-memory report usable.
        }
    }
    updateFeedbackPanel();
}

function recordMissingWord(input) {
    const now = new Date().toISOString();
    const existing = feedbackData.missingWords.find(record => record.input === input);
    if (existing) {
        existing.count++;
        existing.lastSeen = now;
    } else {
        feedbackData.missingWords.push({ input, count: 1, firstSeen: now, lastSeen: now });
    }
    persistFeedback();
}

function resetIdeaFeedback() {
    currentIdeaForFeedback = null;
    currentFeedbackIndex = null;
    document.getElementById('idea-feedback').hidden = true;
    document.getElementById('feedback-note').value = '';
    document.getElementById('feedback-note-details').open = false;
    document.getElementById('feedback-status').innerText = '';
    document.getElementById('feedback-helpful').setAttribute('aria-pressed', 'false');
    document.getElementById('feedback-not-helpful').setAttribute('aria-pressed', 'false');
}

function showIdeaFeedback(idea) {
    resetIdeaFeedback();
    currentIdeaForFeedback = idea;
    document.getElementById('idea-feedback').hidden = false;
}

function rateIdea(rating) {
    if (!['helpful', 'not-helpful'].includes(rating)) return;
    saveIdeaFeedback(rating);
}

function saveIdeaNote() {
    const rating = currentFeedbackIndex === null ? null : feedbackData.ideaFeedback[currentFeedbackIndex].rating;
    saveIdeaFeedback(rating);
}

function saveIdeaFeedback(rating) {
    if (!currentIdeaForFeedback) return;
    const note = document.getElementById('feedback-note').value.trim().slice(0, 500);
    if (!rating && !note && currentFeedbackIndex === null) {
        document.getElementById('feedback-status').innerText = 'Write a note or choose Helpful / Didn’t help.';
        return;
    }
    const now = new Date().toISOString();
    if (currentFeedbackIndex === null) {
        currentFeedbackIndex = feedbackData.ideaFeedback.length;
        feedbackData.ideaFeedback.push({ ...currentIdeaForFeedback, rating, note, createdAt: now, updatedAt: now });
    } else {
        Object.assign(feedbackData.ideaFeedback[currentFeedbackIndex], { rating, note, updatedAt: now });
    }
    persistFeedback();
    document.getElementById('feedback-helpful').setAttribute('aria-pressed', String(rating === 'helpful'));
    document.getElementById('feedback-not-helpful').setAttribute('aria-pressed', String(rating === 'not-helpful'));
    document.getElementById('feedback-status').innerText = `Thank you! ${feedbackSaveMessage()}`;
}

function updateFeedbackPanel() {
    const missing = feedbackData.missingWords.length;
    const feedback = feedbackData.ideaFeedback.length;
    document.getElementById('feedback-summary').innerText =
        `${missing} missing ${missing === 1 ? 'word' : 'words'} · ${feedback} idea ${feedback === 1 ? 'response' : 'responses'}`;
    document.getElementById('missing-words').innerText = feedbackData.missingWords
        .map(record => `${record.input} (${record.count})`).join(' · ');
    document.getElementById('feedback-storage-status').innerText = feedbackPersistent
        ? 'Saved in this browser. Download a report to share it for a future app update. Clearing browser data removes these records.'
        : feedbackSaveMessage();
    document.getElementById('download-feedback').disabled = missing + feedback === 0;
    document.getElementById('clear-feedback').disabled = missing + feedback === 0 && feedbackStorageReadable;
}

function getFeedbackReport() {
    // Include snapshots of inputs and ideas so a future editor can interpret
    // the feedback even after the local idea collection has changed.
    return JSON.parse(JSON.stringify({
        app: 'Writing Spark',
        exportedAt: new Date().toISOString(),
        ...feedbackData
    }));
}

function downloadFeedback() {
    const report = getFeedbackReport();
    const blob = new Blob([JSON.stringify(report, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `writing-spark-feedback-${report.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function clearSavedFeedback() {
    try {
        window.localStorage.removeItem(FEEDBACK_STORAGE_KEY);
    } catch (_) {
        document.getElementById('feedback-storage-status').innerText = 'Could not clear saved feedback. You can still download the report.';
        document.getElementById('clear-feedback-dialog').close();
        return;
    }
    feedbackData = { schemaVersion: 1, missingWords: [], ideaFeedback: [] };
    feedbackStorageReadable = true;
    feedbackPersistent = true;
    const idea = currentIdeaForFeedback;
    resetIdeaFeedback();
    if (idea) showIdeaFeedback(idea);
    updateFeedbackPanel();
    document.getElementById('clear-feedback-dialog').close();
}
