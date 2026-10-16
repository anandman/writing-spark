const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appSource = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const scriptSources = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]
    .map(match => fs.readFileSync(path.join(root, match[1]), 'utf8'));

// Run the real app with a controllable clock and minimal browser/audio adapters.
function boot({ audio = true, resumeFails = false, storage = new Map(), storageReadFails = false, storageWriteFails = false, navigator = {} } = {}) {
    let now = 0;
    let nextInterval = 0;
    let nextElement = 0;
    let contextsCreated = 0;
    let resumeCalls = 0;
    const notes = [];
    const elements = new Map();
    const intervals = new Map();
    const events = new Map();
    function element(id) {
        if (!elements.has(id)) {
            const classes = new Set();
            elements.set(id, {
                innerText: '', innerHTML: '', offsetWidth: 0,
                children: [],
                attributes: {}, value: '', open: false, hidden: false, listeners: new Map(),
                classList: {
                    add: (...names) => names.forEach(name => classes.add(name)),
                    remove: (...names) => names.forEach(name => classes.delete(name)),
                    toggle(name, force) { if (force) classes.add(name); else classes.delete(name); },
                },
                setAttribute(name, value) { this.attributes[name] = value; },
                appendChild(child) { this.children.push(child); return child; },
                replaceChildren(...children) { this.children = children; },
                addEventListener(name, fn) { this.listeners.set(name, fn); },
                dispatch(name, event = {}) { this.listeners.get(name)?.(event); },
                setCustomValidity(message) { this.validationMessage = message; },
                showModal() { this.open = true; },
                close() { this.open = false; },
                focus() {}, select() {}, reportValidity() {},
            });
        }
        return elements.get(id);
    }
    class AudioContext {
        state = 'suspended';
        currentTime = 0;
        destination = {};
        constructor() { contextsCreated++; }
        resume() {
            resumeCalls++;
            if (resumeFails) return Promise.reject(new Error('Audio unavailable'));
            this.state = 'running';
            return Promise.resolve();
        }
        createGain() {
            return {
                gain: {
                    value: 1,
                    setValueAtTime(value) { this.value = value; },
                    linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {},
                },
                connect() {}, disconnect() {},
            };
        }
        createOscillator() {
            return {
                frequency: { setValueAtTime() {} },
                connect() {}, disconnect() {},
                start(time) { notes.push(time); }, stop() {},
            };
        }
    }
    const context = vm.createContext({
        navigator,
        window: {
            AudioContext: audio ? AudioContext : undefined,
            addEventListener(name, fn) { events.set(name, fn); },
            localStorage: {
                getItem(key) {
                    if (storageReadFails) throw new Error('Storage blocked');
                    return storage.get(key) ?? null;
                },
                setItem(key, value) {
                    if (storageWriteFails) throw new Error('Storage full');
                    storage.set(key, value);
                },
                removeItem(key) {
                    if (storageWriteFails) throw new Error('Storage blocked');
                    storage.delete(key);
                },
            },
        },
        document: {
            body: element('body'), hidden: false,
            getElementById: element,
            createElement: tag => element(`${tag}-${++nextElement}`),
            querySelector: selector => element(selector),
            querySelectorAll: () => [element('main-wedge'), element('zen-wedge')],
            addEventListener(name, fn) { events.set(name, fn); },
        },
        Date: class extends Date {
            constructor(...args) { super(...(args.length ? args : [now])); }
            static now() { return now; }
        },
        setInterval(callback) { intervals.set(++nextInterval, callback); return nextInterval; },
        clearInterval(id) { intervals.delete(id); },
    });
    const run = code => vm.runInContext(code, context);
    scriptSources.forEach(run);
    run(appSource);
    run('window.onload()');
    return {
        run, element, notes, events, storage,
        character(value) {
            element('character-input').value = value;
            element('character-input').dispatch('input');
        },
        elapse(ms) { now += ms; },
        tick(ms) { now += ms; [...intervals.values()].forEach(fn => fn()); },
        digital: () => element('digital-timer').innerText,
        intervals: () => intervals.size,
        contexts: () => contextsCreated,
        resumes: () => resumeCalls,
    };
}

test('timer input rejects malformed/out-of-range values without corrupting state', () => {
    const app = boot();
    for (const value of ['', ' ', '.5', '1.5', 'Infinity', 'NaN', '0', '-1', '11', '5abc', '1e1']) {
        assert.equal(app.run(`setTimerMinutes(${JSON.stringify(value)})`), false, value);
        assert.equal(app.digital(), '05:00');
    }
    assert.equal(app.run('setTimerMinutes(" 1 ")'), true);
    assert.equal(app.digital(), '01:00');
    assert.equal(app.run('setTimerMinutes("10")'), true);
    assert.equal(app.digital(), '10:00');
    app.run('startTimer()');
    assert.equal(app.run('setTimerMinutes("2")'), false);
    assert.equal(app.digital(), '10:00');
});

test('timer finishes exactly at its deadline and immediately starts the next round', () => {
    const app = boot();
    app.run('setTimerMinutes("1"); startTimer()');
    app.tick(59999);
    assert.equal(app.digital(), '00:01');
    assert.equal(app.notes.length, 0);
    app.tick(1);
    assert.equal(app.digital(), '01:00');
    assert.equal(app.notes.length, 6);
    app.tick(60000);
    assert.equal(app.digital(), '01:00');
    assert.equal(app.notes.length, 12);
});

test('delayed callbacks reflect elapsed time instead of callback count', () => {
    const app = boot();
    app.run('startTimer()');
    app.tick(60000);
    assert.equal(app.digital(), '04:00');
});

test('resume after several missed rounds catches up and chimes only once', () => {
    const app = boot();
    app.run('setTimerMinutes("1"); startTimer()');
    app.elapse(200000);
    app.events.get('visibilitychange')();
    assert.equal(app.digital(), '00:40');
    assert.equal(app.notes.length, 6);
    app.events.get('pageshow')();
    assert.equal(app.notes.length, 6);
    app.tick(40000);
    assert.equal(app.notes.length, 12);
});

test('pause and resume preserve fractional seconds and exclude paused time', () => {
    const app = boot();
    app.run('setTimerMinutes("1"); startTimer()');
    app.elapse(1450);
    app.run('pauseTimer()');
    assert.equal(app.digital(), '00:59');
    assert.equal(app.intervals(), 0);
    app.elapse(600000);
    app.run('startTimer(); startTimer()');
    assert.equal(app.intervals(), 1);
    app.tick(58549);
    assert.equal(app.notes.length, 0);
    app.tick(1);
    assert.equal(app.digital(), '01:00');
    assert.equal(app.notes.length, 6);
});

test('reset stops the timer without playing overdue alarms', () => {
    const app = boot();
    app.run('startTimer()');
    app.elapse(400000);
    app.run('resetTimer()');
    assert.equal(app.digital(), '05:00');
    assert.equal(app.intervals(), 0);
    assert.equal(app.notes.length, 0);
});

test('new ideas restart the configured timer and retain a single interval', () => {
    const app = boot();
    app.character('雨');
    app.run('getSpark()');
    app.tick(12500);
    app.run('getSpark()');
    assert.equal(app.digital(), '05:00');
    assert.equal(app.intervals(), 1);
    assert.match(app.element('spark-display').innerText, /rain|puddle|umbrella/i);
});

test('+1m preserves elapsed fractions, starts a paused timer, and caps at 10 minutes', () => {
    const app = boot();
    app.run('startTimer()');
    app.elapse(30000.5);
    app.run('snoozeTimer()');
    assert.equal(app.digital(), '05:30');
    app.tick(329999.5);
    assert.equal(app.notes.length, 6);
    app.run('resetTimer(); setTimerMinutes("10"); snoozeTimer()');
    assert.equal(app.digital(), '10:00');
    assert.equal(app.intervals(), 1);
});

test('audio starts during user actions, not page load, and mute controls output', () => {
    const app = boot();
    assert.equal(app.contexts(), 0);
    app.run('toggleSound(); startTimer()');
    assert.equal(app.contexts(), 0);
    app.run('toggleSound()');
    assert.equal(app.contexts(), 1);
    assert.equal(app.resumes(), 1);
    app.tick(300000);
    assert.equal(app.notes.length, 6);
    app.run('toggleSound()');
    assert.equal(app.run('audioOutput.gain.value'), 0);
    app.tick(300000);
    assert.equal(app.notes.length, 6);
    app.run('toggleSound()');
    assert.equal(app.run('audioOutput.gain.value'), 1);
});

test('unavailable or rejected audio does not prevent the timer from looping', async () => {
    for (const options of [{ audio: false }, { resumeFails: true }]) {
        const app = boot(options);
        app.run('startTimer()');
        await Promise.resolve();
        app.tick(300000);
        assert.equal(app.digital(), '05:00');
        assert.equal(app.notes.length, 0);
        assert.equal(app.intervals(), 1);
    }
});

test('English shows every prompt before repeating, with varied strategies across refills', () => {
    const app = boot();
    app.run('let seed = 42; Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296)');
    for (const mode of ['english']) {
        const count = app.run(`PROMPTS_CONFIG.${mode}.length`);
        const draw = () => app.run(`nextPrompt('${mode}', PROMPTS_CONFIG.${mode})`);
        let previous;
        for (let round = 0; round < 20; round++) {
            const cards = Array.from({ length: count }, draw);
            assert.equal(new Set(cards.map(card => card.text)).size, count);
            for (const card of cards) {
                assert.notEqual(card.text, previous?.text);
                assert.notEqual(card.strategy, previous?.strategy);
                previous = card;
            }
        }
    }
});

test('the English deck keeps all eight approaches available throughout each round', () => {
    const app = boot();
    for (const mode of ['english']) {
        const count = app.run(`PROMPTS_CONFIG.${mode}.length`);
        const strategies = app.run(`new Set(PROMPTS_CONFIG.${mode}.map(prompt => prompt.strategy)).size`);
        for (let i = 0; i < count; i += strategies) {
            const cards = Array.from({ length: strategies }, () => app.run(`nextPrompt('${mode}', PROMPTS_CONFIG.${mode})`));
            assert.equal(new Set(cards.map(card => card.strategy)).size, strategies);
        }
    }
});

test('uneven categories favor another approach whenever one remains without dropping cards', () => {
    const app = boot();
    const cards = [
        { strategy: 'memory', text: 'memory one' },
        { strategy: 'memory', text: 'memory two' },
        { strategy: 'memory', text: 'memory three' },
        { strategy: 'memory', text: 'memory four' },
        { strategy: 'people', text: 'people one' },
        { strategy: 'senses', text: 'senses one' },
    ];
    app.run(`const sampleCards = ${JSON.stringify(cards)}`);
    let previous;
    for (let round = 0; round < 3; round++) {
        const remaining = new Map(cards.map(card => [card.text, card]));
        for (let i = 0; i < cards.length; i++) {
            const hasDifferentStrategy = [...remaining.values()].some(card => card.strategy !== previous?.strategy);
            const card = app.run('nextPrompt("chinese", sampleCards)');
            assert(remaining.has(card.text));
            if (hasDifferentStrategy) assert.notEqual(card.strategy, previous?.strategy);
            if (remaining.size > 1) assert.notEqual(card.text, previous?.text);
            remaining.delete(card.text);
            previous = card;
        }
        assert.equal(remaining.size, 0);
    }
});

test('single-category and single-card decks stay usable and avoid preventable repeats', () => {
    const app = boot();
    app.run('const smallDeck = [{ strategy: "memory", text: "one" }, { strategy: "memory", text: "two" }]; Math.random = () => 0');
    let previous;
    for (let i = 0; i < 12; i++) {
        const card = app.run('nextPrompt("chinese", smallDeck)');
        assert.notEqual(card.text, previous);
        previous = card.text;
    }
    app.run('const singleCard = [{ strategy: "speaking", text: "one cue" }]');
    for (let i = 0; i < 3; i++) assert.equal(app.run('nextPrompt("english", singleCard).text'), 'one cue');
    assert.equal(app.run('nextPrompt("english", [])'), null);
});

test('prompt data has usable strategy tags and distinct plain-text cues', () => {
    const app = boot();
    for (const mode of ['english']) {
        const cards = app.run(`PROMPTS_CONFIG.${mode}`);
        assert(cards.length > 0);
        assert.equal(new Set(cards.map(card => card.text)).size, cards.length);
        for (const card of cards) {
            assert.equal(typeof card.strategy, 'string');
            assert.match(card.strategy, /^[a-z]+$/);
            assert.equal(typeof card.text, 'string');
            assert(card.text.trim().length > 0);
            assert.equal(card.text, card.text.trim());
        }
    }
});

test('switching modes preserves each deck and announces the selected mode', () => {
    const app = boot();
    app.character('雨');
    app.run('getSpark()');
    const first = app.element('spark-display').innerText;
    app.run('setMode("english"); getSpark(); setMode("chinese"); getSpark()');
    assert.notEqual(app.element('spark-display').innerText, first);
    assert.equal(app.element('btn-chinese').attributes['aria-pressed'], 'true');
    assert.equal(app.element('btn-english').attributes['aria-pressed'], 'false');
});

test('timer completion leaves the current suggestion and deck in place', () => {
    const app = boot();
    app.character('雨');
    app.run('getSpark()');
    const prompt = app.element('spark-display').innerText;
    const remaining = app.run('promptDecks["character:雨"].length');
    app.tick(300000);
    assert.equal(app.element('spark-display').innerText, prompt);
    assert.equal(app.run('promptDecks["character:雨"].length'), remaining);
    assert.equal(app.notes.length, 6);
});

test('a typed character gets a related situation and a word that uses it', () => {
    const app = boot();
    app.character('  雨\n');
    const seen = new Set();
    let previous;
    for (let i = 0; i < 6; i++) {
        app.run('getSpark()');
        const idea = app.element('spark-display').innerText;
        assert.equal(app.element('idea-word').innerText, '下雨');
        assert.match(idea, /rain|puddle|umbrella/i);
        assert.notEqual(idea, previous);
        if (i < 3) seen.add(idea);
        previous = idea;
    }
    assert.equal(seen.size, 3);
    assert.equal(app.element('idea-button').innerText, '✨ Try another idea');
    assert.equal(app.element('idea-context').hidden, false);
});

test('invalid and missing characters do not start a timer or show an unrelated idea', () => {
    const app = boot();
    for (const value of ['', ' ', 'yu', '学 校', '学校!', '学校abc', '雨!', '🌧', '<img>', '1']) {
        app.character(value);
        app.run('getSpark()');
        assert.equal(app.intervals(), 0, value);
        assert.equal(app.element('character-input').attributes['aria-invalid'], 'true');
        assert.match(app.element('character-error').innerText, /Chinese character or word/i);
        assert.equal(app.element('idea-context').hidden, true);
    }
});

test('unknown Han characters have honest feedback and cannot leave a stale idea', () => {
    const app = boot();
    app.character('雨');
    app.run('getSpark()');
    app.tick(20000);
    for (const value of ['龘', '𠮷']) {
        app.character(value);
        app.run('getSpark()');
        assert.match(app.element('character-error').innerText, /don't have an idea.*yet/i);
        assert(app.element('character-error').innerText.includes(value));
        assert.doesNotMatch(app.element('spark-display').innerText, /rain|puddle|umbrella/i);
        assert.equal(app.element('idea-context').hidden, true);
        assert.equal(app.digital(), '04:40');
    }
});

test('changing a character clears the old card and preserves each character deck', () => {
    const app = boot();
    app.character('雨');
    app.run('getSpark()');
    const first = app.element('spark-display').innerText;
    app.character('猫');
    assert.notEqual(app.element('spark-display').innerText, first);
    assert.equal(app.element('idea-context').hidden, true);
    assert.match(app.element('idea-button').innerText, /Give me an idea/);
    app.run('getSpark()');
    assert.equal(app.element('idea-word').innerText, '猫');
    assert.match(app.element('spark-display').innerText, /cat|kitten/i);
    app.character('雨');
    app.run('getSpark()');
    assert.notEqual(app.element('spark-display').innerText, first);
    assert.equal(app.element('idea-word').innerText, '下雨');
});

test('Chinese composition and candidate-confirmation Enter cannot request an idea', () => {
    const app = boot();
    const input = app.element('character-input');
    app.character('雨');
    input.dispatch('compositionstart');
    input.dispatch('keydown', { key: 'Enter', isComposing: false });
    app.run('getSpark()');
    assert.equal(app.intervals(), 0);
    input.dispatch('compositionend');
    input.dispatch('keydown', { key: 'Enter', isComposing: true });
    input.dispatch('keydown', { key: 'Enter', keyCode: 229 });
    assert.equal(app.intervals(), 0);
    input.dispatch('keydown', { key: 'Enter', preventDefault() {} });
    assert.equal(app.intervals(), 1);
    assert.equal(app.element('idea-word').innerText, '下雨');
});

test('English mode hides character controls and works without Chinese input', () => {
    const app = boot();
    app.run('setMode("english"); getSpark()');
    assert.equal(app.element('character-entry').hidden, true);
    assert.equal(app.element('idea-context').hidden, true);
    assert.equal(app.intervals(), 1);
    assert.equal(app.run('PROMPTS_CONFIG.english.some(card => card.text === document.getElementById("spark-display").innerText)'), true);
    app.run('setMode("chinese")');
    assert.equal(app.element('character-entry').hidden, false);
    assert.equal(app.element('idea-context').hidden, true);
});

test('traditional input gives relevant ideas with simplified words', () => {
    const app = boot();
    for (const [character, simplified] of [['學', '学'], ['樂', '乐'], ['貓', '猫'], ['書', '书'], ['愛', '爱']]) {
        app.character(character);
        app.run('getSpark()');
        assert.equal(app.element('idea-context').hidden, false, character);
        assert(app.element('idea-word').innerText.includes(simplified), character);
        assert(!app.element('card-label').innerText.includes(character), character);
        assert(app.element('spark-display').innerText.length > 10);
    }
});

test('every listed character has distinct usable ideas and matching words', () => {
    const app = boot();
    const characters = app.element('supported-characters').innerText.replace(/\s/g, '');
    assert(characters.includes('雨'));
    assert(characters.includes('学'));
    assert.doesNotMatch(characters, /[學樂貓書愛]/);
    assert.equal(new Set(characters).size, [...characters].length);
    for (const character of characters) {
        const cards = app.run(`ideasForText(${JSON.stringify(character)})`);
        assert(cards.length >= 3, character);
        assert.equal(new Set(cards.map(card => card.text)).size, cards.length, character);
        for (const card of cards) {
            assert(card.word.includes(character), character);
            assert(card.meaning.trim());
            assert(card.text.trim().length > 10);
            assert.doesNotMatch(card.text, /<[^>]*>|[。！？]/);
        }
    }
});

test('compound words get ideas for the whole word, including traditional and longer words', () => {
    const app = boot();
    for (const [input, word, topic] of [
        ['  学校\n', '学校', /school/i],
        ['學校', '学校', /school/i],
        ['朋友', '朋友', /friend/i],
        ['快乐', '快乐', /happy/i],
        ['快樂', '快乐', /happy/i],
        ['好朋友', '好朋友', /friend/i],
    ]) {
        app.character(input);
        const seen = new Set();
        let previous;
        for (let i = 0; i < 6; i++) {
            app.run('getSpark()');
            const idea = app.element('spark-display').innerText;
            assert.equal(app.element('idea-context').hidden, false, input);
            assert.equal(app.element('character-error').innerText, '', input);
            assert.equal(app.element('idea-word').innerText, word);
            assert.match(idea, topic);
            assert.notEqual(idea, previous);
            if (i < 3) seen.add(idea);
            previous = idea;
        }
        assert.equal(seen.size, 3, input);
        assert.equal(app.intervals(), 1);
    }
});

test('unsupported compounds do not fall back to unrelated individual-character ideas', () => {
    const app = boot();
    app.character('雨');
    app.run('getSpark()');
    app.tick(20000);
    for (const word of ['雨天', '星际旅行', '猫狗', '校学']) {
        app.character(word);
        app.run('getSpark()');
        assert.match(app.element('character-error').innerText, /don't have an idea.*yet/i);
        assert(app.element('character-error').innerText.includes(word));
        assert.equal(app.element('idea-context').hidden, true);
        assert.equal(app.element('idea-word').innerText, '');
        assert.equal(app.digital(), '04:40');
    }
});

test('trip accounts and school vocabulary have their own complete-word ideas', () => {
    const app = boot();
    for (const [input, word, topic] of [
        ['游记', '游记', /travel journal/i],
        ['游記', '游记', /travel journal/i],
        ['观察', '观察', /observe|watch|notice/i],
        ['经历', '经历', /experience/i],
        ['学生', '学生', /student/i],
        ['完成', '完成', /finish|complet/i],
    ]) {
        app.character(input);
        const seen = new Set();
        for (let i = 0; i < 3; i++) {
            app.run('getSpark()');
            assert.equal(app.element('character-error').innerText, '', input);
            assert.equal(app.element('idea-word').innerText, word);
            const idea = app.element('spark-display').innerText;
            assert.match(idea, topic);
            seen.add(idea);
        }
        assert.equal(seen.size, 3, input);
    }
    assert.equal(app.run('getFeedbackReport().missingWords.length'), 0);
});

test('Better Immersion source preserves level and unit boundaries with standard Han characters', () => {
    const app = boot();
    for (const [level, unitCount, total] of [[2, 27, 151], [3, 27, 225], [4, 13, 117]]) {
        const units = app.run(`BETTER_IMMERSION_LEVELS[${level}]`);
        assert.equal(units.length, unitCount);
        const characters = units.map(unit => unit.characters).join('');
        assert.equal([...characters].length, total);
        assert.equal(new Set(characters).size, total);
        assert.match(characters, /^[\u4e00-\u9fff]+$/u);
        for (let i = 0; i < units.length; i++) assert.equal(units[i].unit, i + 1);
        const coverage = app.run(`curriculumCoverage(${level})`);
        assert.equal(coverage.total, total);
        assert.equal(coverage.available + coverage.missing.length, total);
    }
    assert.equal(app.run('curriculumUnit(2, 1).characters'), '狗努猫牛像');
    assert.equal(app.run('curriculumUnit(3, 25).characters'), '恐龙灭绝考古已颗灾');
    assert.equal(app.run('curriculumUnit(4, 6).characters'), '游假旁停谈访止判程');
    assert.equal(app.run('curriculumUnit(4, 14)'), null);
    assert.equal(app.run('curriculumUnit(99, 1)'), null);
});

test('every Better Immersion Level 4 character has at least three word-specific ideas', () => {
    const app = boot();
    const missing = [];
    for (const unit of app.run('BETTER_IMMERSION_LEVELS[4]')) {
        for (const character of unit.characters) {
            const cards = app.run(`ideasForText(${JSON.stringify(character)})`);
            if (cards.length < 3) missing.push(`${unit.unit}: ${character}`);
            for (const card of cards) assert(card.word.includes(character), character);
        }
    }
    assert.deepEqual(missing, []);
    assert.equal(app.run('curriculumCoverage(4).available'), 117);
});

test('curriculum browsing preserves the active idea, timer and feedback and resets invalid units', () => {
    const app = boot();
    app.character('游记');
    app.run('getSpark(); rateIdea("helpful")');
    app.tick(20000);
    const idea = app.element('spark-display').innerText;
    app.element('curriculum-level').value = '2';
    app.element('curriculum-level').dispatch('change');
    assert.equal(app.element('curriculum-unit').children.length, 27);
    assert.match(app.element('curriculum-missing').innerText, /像/);
    app.element('curriculum-unit').value = '18';
    app.element('curriculum-unit').dispatch('change');
    assert.equal(app.element('curriculum-characters').children.length, 0);
    assert.doesNotMatch(app.element('curriculum-unit-status').innerText, /Tap a character/);
    app.element('curriculum-unit').value = '27';
    app.element('curriculum-unit').dispatch('change');
    app.element('curriculum-level').value = '4';
    app.element('curriculum-level').dispatch('change');
    assert.equal(app.element('curriculum-unit').children.length, 13);
    assert.equal(app.element('curriculum-unit').value, '1');
    assert.equal(app.element('curriculum-characters').children.length, 9);
    assert.equal(app.element('curriculum-missing').hidden, true);
    assert.match(app.element('curriculum-coverage').innerText, /117 of 117/);
    assert.equal(app.element('character-input').value, '游记');
    assert.equal(app.element('spark-display').innerText, idea);
    assert.equal(app.digital(), '04:40');
    assert.equal(app.run('getFeedbackReport().missingWords.length'), 0);
    assert.equal(app.run('getFeedbackReport().ideaFeedback.length'), 1);
});

test('selecting a curriculum character requests its idea and respects composition and mode', () => {
    const app = boot();
    app.run('chooseCurriculumCharacter("查")');
    assert.equal(app.element('character-input').value, '查');
    assert.equal(app.element('idea-word').innerText, '检查');
    assert.equal(app.intervals(), 1);
    app.run('rateIdea("helpful")');
    app.element('character-input').dispatch('compositionstart');
    app.run('chooseCurriculumCharacter("族")');
    assert.equal(app.element('character-input').value, '查');
    app.element('character-input').dispatch('compositionend');
    app.run('chooseCurriculumCharacter("族")');
    assert.equal(app.element('character-input').value, '族');
    assert.equal(app.element('idea-word').innerText, '家族');
    assert.equal(app.element('feedback-helpful').attributes['aria-pressed'], 'false');
    app.run('chooseCurriculumCharacter("像"); chooseCurriculumCharacter("<script>")');
    assert.equal(app.element('character-input').value, '族');
    assert.equal(app.run('getFeedbackReport().missingWords.length'), 0);
    app.run('setMode("english"); chooseCurriculumCharacter("查")');
    assert.equal(app.element('character-input').value, '族');
});

test('word decks survive switching to a character or English without mixing their ideas', () => {
    const app = boot();
    app.character('学校');
    app.run('getSpark()');
    const first = app.element('spark-display').innerText;
    app.character('学');
    app.run('getSpark()');
    app.run('setMode("english"); getSpark(); setMode("chinese")');
    app.character('学校');
    app.run('getSpark()');
    assert.equal(app.element('idea-word').innerText, '学校');
    const second = app.element('spark-display').innerText;
    assert.notEqual(second, first);
    app.run('getSpark()');
    const third = app.element('spark-display').innerText;
    assert.notEqual(third, second);
    assert.notEqual(third, first);
});

test('composing a compound word cannot submit a partly entered word', () => {
    const app = boot();
    const input = app.element('character-input');
    app.character('学');
    input.dispatch('compositionstart');
    app.character('学校');
    input.dispatch('keydown', { key: 'Enter', isComposing: true });
    app.run('getSpark()');
    assert.equal(app.intervals(), 0);
    input.dispatch('compositionend');
    input.dispatch('keydown', { key: 'Enter', keyCode: 229 });
    assert.equal(app.intervals(), 0);
    input.dispatch('keydown', { key: 'Enter', preventDefault() {} });
    assert.equal(app.intervals(), 1);
    assert.equal(app.element('idea-word').innerText, '学校');
});

test('every listed word is available as a complete word in its displayed script', () => {
    const app = boot();
    const words = app.element('supported-words').innerText.trim().split(/\s+/);
    assert(words.includes('学校'));
    assert(!words.includes('學校'));
    assert(!words.includes('快樂'));
    assert(words.includes('好朋友'));
    assert.equal(new Set(words).size, words.length);
    for (const word of words) {
        const cards = app.run(`ideasForText(${JSON.stringify(word)})`);
        assert(cards.length >= 3, word);
        assert.equal(new Set(cards.map(card => card.text)).size, cards.length, word);
        for (const card of cards) assert.equal(card.word, word);
    }
});

test('every input alias returns simplified words and coverage lists only simplified forms', () => {
    const app = boot();
    const entries = app.run('CHARACTER_IDEAS');
    const simplifiedWords = new Set(entries.map(entry => entry.words[0]));
    const simplifiedCharacters = new Set([...simplifiedWords].join(''));
    assert.deepEqual(
        new Set(app.element('supported-characters').innerText.split(' ')),
        simplifiedCharacters
    );
    assert.deepEqual(
        new Set(app.element('supported-words').innerText.split(' ')),
        new Set([...simplifiedWords].filter(word => [...word].length > 1))
    );
    for (const entry of entries) {
        for (const alias of entry.words) {
            for (const input of new Set([alias, ...alias])) {
                const cards = app.run(`ideasForText(${JSON.stringify(input)})`);
                assert(cards.length >= 3, input);
                assert(cards.every(card => simplifiedWords.has(card.word)), input);
                if ([...input].length > 1) {
                    assert(cards.every(card => card.word === entry.words[0]), input);
                }
            }
        }
    }
});

test('feedback preserves the typed input alongside the simplified suggestion', () => {
    const app = boot();
    app.character('學校');
    app.run('getSpark(); rateIdea("helpful")');
    const record = boot({storage: app.storage}).run('getFeedbackReport().ideaFeedback[0]');
    assert.equal(record.input, '學校');
    assert.equal(record.word, '学校');
});

test('unknown words are counted and survive reload while invalid and known inputs are excluded', () => {
    const app = boot();
    for (const word of ['  星际旅行 ', '星际旅行', '雨天', 'hello', '学 校', '学校']) {
        app.character(word);
        app.run('getSpark()');
        app.elapse(1000);
    }
    assert.match(app.element('feedback-summary').innerText, /2 missing/);
    const reloaded = boot({storage: app.storage});
    const report = reloaded.run('getFeedbackReport()');
    assert.equal(report.schemaVersion, 1);
    assert.equal(report.missingWords.length, 2);
    assert.equal(report.missingWords.find(record => record.input === '星际旅行').count, 2);
    assert.equal(report.missingWords.find(record => record.input === '星际旅行').firstSeen, '1970-01-01T00:00:00.000Z');
    assert.equal(report.missingWords.find(record => record.input === '星际旅行').lastSeen, '1970-01-01T00:00:01.000Z');
    assert.equal(report.ideaFeedback.length, 0);
});

test('rating and note updates keep one record with the original idea and leave the timer alone', () => {
    const app = boot();
    app.character('学校');
    app.run('getSpark()');
    const idea = app.element('spark-display').innerText;
    app.tick(20000);
    app.run('rateIdea("helpful")');
    app.element('feedback-note').value = 'I want an idea about recess. <script>alert(1)</script>';
    app.run('saveIdeaNote(); rateIdea("not-helpful")');
    const report = boot({storage: app.storage}).run('getFeedbackReport()');
    assert.equal(report.ideaFeedback.length, 1);
    const record = report.ideaFeedback[0];
    assert.equal(record.input, '学校');
    assert.equal(record.word, '学校');
    assert.equal(record.mode, 'chinese');
    assert.equal(record.idea, idea);
    assert.equal(record.rating, 'not-helpful');
    assert.equal(record.note, 'I want an idea about recess. <script>alert(1)</script>');
    assert.equal(app.element('spark-display').innerText, idea);
    assert.equal(app.digital(), '04:40');
    assert.equal(app.intervals(), 1);
});

test('a new idea or edit resets feedback so it cannot be attached to a stale idea', () => {
    const app = boot();
    app.character('学校');
    app.run('getSpark(); rateIdea("helpful"); getSpark()');
    assert.equal(app.element('feedback-note').value, '');
    assert.equal(app.element('feedback-helpful').attributes['aria-pressed'], 'false');
    app.element('feedback-note').value = 'Another idea please';
    app.run('saveIdeaNote()');
    app.character('星际旅行');
    assert.equal(app.element('idea-feedback').hidden, true);
    app.run('rateIdea("not-helpful"); saveIdeaNote()');
    const report = app.run('getFeedbackReport()');
    assert.equal(report.ideaFeedback.length, 2);
    assert.notEqual(report.ideaFeedback[0].idea, report.ideaFeedback[1].idea);
    assert.equal(report.ideaFeedback[1].rating, null);
    assert.equal(report.ideaFeedback[1].note, 'Another idea please');
});

test('English feedback has no stale Chinese input and an optional note is bounded', () => {
    const app = boot();
    app.character('学校');
    app.run('getSpark(); setMode("english"); getSpark()');
    app.element('feedback-note').value = 'x'.repeat(600);
    app.run('saveIdeaNote()');
    const record = app.run('getFeedbackReport().ideaFeedback[0]');
    assert.equal(record.mode, 'english');
    assert.equal(record.input, '');
    assert.equal(record.word, '');
    assert.equal(record.note.length, 500);
});

test('storage failures keep writing usable and feedback exportable without promising persistence', () => {
    for (const options of [{storageReadFails: true}, {storageWriteFails: true}]) {
        const app = boot(options);
        app.character('星际旅行');
        app.run('getSpark()');
        assert.match(app.element('character-error').innerText, /this visit only/i);
        app.character('学校');
        app.run('getSpark(); rateIdea("helpful")');
        assert.match(app.element('feedback-status').innerText, /this visit only/i);
        const report = app.run('getFeedbackReport()');
        assert.equal(report.missingWords.length, 1);
        assert.equal(report.ideaFeedback.length, 1);
        assert.equal(app.intervals(), 1);
    }
});

test('malformed or incompatible saved data is not overwritten and does not break new feedback', () => {
    for (const value of ['{broken', '{"schemaVersion":2}', '{"schemaVersion":1,"missingWords":[null],"ideaFeedback":[]}']) {
        const storage = new Map([['writing-spark-feedback-v1', value]]);
        const app = boot({storage});
        app.character('星际旅行');
        app.run('getSpark()');
        assert.equal(storage.get('writing-spark-feedback-v1'), value);
        assert.match(app.element('feedback-storage-status').innerText, /this visit only/i);
        assert.equal(app.run('getFeedbackReport().missingWords.length'), 1);
    }
});

test('clearing feedback removes only this app’s records and prevents stale rating updates', () => {
    const app = boot({storage: new Map([['unrelated', 'keep me']])});
    app.character('星际旅行');
    app.run('getSpark()');
    app.character('学校');
    app.run('getSpark(); rateIdea("helpful"); clearSavedFeedback()');
    assert.equal(app.storage.get('unrelated'), 'keep me');
    assert.equal(app.run('getFeedbackReport().missingWords.length'), 0);
    assert.equal(boot({storage: app.storage}).run('getFeedbackReport().ideaFeedback.length'), 0);
    app.run('rateIdea("not-helpful")');
    assert.equal(app.run('getFeedbackReport().ideaFeedback.length'), 1);
    assert.equal(app.run('getFeedbackReport().ideaFeedback[0].rating'), 'not-helpful');
});

test('the message report preserves missing counts, exact ideas, ratings and multiline notes', () => {
    const app = boot();
    app.character('星际旅行');
    app.run('getSpark(); getSpark()');
    app.character('学校');
    app.run('getSpark(); rateIdea("not-helpful")');
    const idea = app.element('spark-display').innerText;
    app.element('feedback-note').value = 'More playground ideas.\n中文也可以。';
    app.run('saveIdeaNote(); setMode("english"); getSpark(); rateIdea("helpful")');
    const englishIdea = app.element('spark-display').innerText;
    const message = app.run('getFeedbackMessage()');
    assert.match(message, /Writing Spark feedback/);
    assert.match(message, /星际旅行.*2 requests/);
    assert(message.includes('Chinese: 学校'));
    assert(message.includes('Suggested word: 学校'));
    assert(message.includes(idea));
    assert(message.includes('Didn’t help'));
    assert(message.includes('More playground ideas.\n中文也可以。'));
    assert(message.includes('English story'));
    assert(message.includes(englishIdea));
    assert(message.includes('Helpful'));
});

test('Share hands plain text to native sharing without attachments, deleting records or changing the timer', async () => {
    const payloads = [];
    const app = boot({navigator: {share: async payload => payloads.push(payload)}});
    app.character('星际旅行'); app.run('getSpark()');
    app.character('学校'); app.run('getSpark(); rateIdea("helpful")');
    app.tick(20000);
    const before = app.storage.get('writing-spark-feedback-v1');
    const promise = app.run('shareFeedback()');
    assert.equal(payloads.length, 1); // Invoke during the gesture, before awaiting anything else.
    await promise;
    assert.equal(payloads[0].title, 'Writing Spark feedback');
    assert(payloads[0].text.includes('星际旅行'));
    assert(payloads[0].text.includes('Chinese: 学校'));
    assert.equal(payloads[0].files, undefined);
    assert.equal(payloads[0].url, undefined);
    assert.equal(app.storage.get('writing-spark-feedback-v1'), before);
    assert.equal(app.digital(), '04:40');
    assert.equal(app.element('share-feedback').disabled, false);
});

test('canceling native sharing does not copy feedback or claim it was sent', async () => {
    const copied = [];
    const app = boot({navigator: {
        share: async () => { throw {name: 'AbortError'}; },
        clipboard: {writeText: async text => copied.push(text)},
    }});
    app.character('星际旅行'); app.run('getSpark()');
    await app.run('shareFeedback()');
    assert.equal(copied.length, 0);
    assert.match(app.element('feedback-share-status').innerText, /closed/i);
    assert.equal(app.element('feedback-copy-fallback').hidden, true);
    assert.equal(app.run('getFeedbackReport().missingWords.length'), 1);
});

test('without native sharing Share copies the message and reports that it was copied', async () => {
    const copied = [];
    const app = boot({navigator: {clipboard: {writeText: async text => copied.push(text)}}});
    app.character('星际旅行'); app.run('getSpark()');
    await app.run('shareFeedback()');
    assert.equal(copied.length, 1);
    assert(copied[0].includes('星际旅行'));
    assert.match(app.element('feedback-share-status').innerText, /copied.*paste/i);
    assert.equal(app.element('feedback-copy-fallback').hidden, true);
});

test('native share failure exposes complete selectable text without losing saved feedback', async () => {
    const app = boot({navigator: {share: async () => { throw {name: 'NotAllowedError'}; }}});
    app.character('星际旅行'); app.run('getSpark()');
    await app.run('shareFeedback()');
    assert.equal(app.element('feedback-copy-fallback').hidden, false);
    assert(app.element('feedback-share-text').value.includes('星际旅行'));
    assert.match(app.element('feedback-share-status').innerText, /copy/i);
    assert.equal(app.run('getFeedbackReport().missingWords.length'), 1);
});

test('Copy works independently and falls back to selectable text if clipboard permission is denied', async () => {
    const copied = [];
    const app = boot({navigator: {clipboard: {writeText: async text => copied.push(text)}}});
    app.character('学校'); app.run('getSpark(); rateIdea("helpful")');
    await app.run('copyFeedback()');
    assert.equal(copied.length, 1);
    assert(copied[0].includes('Chinese: 学校'));
    const blocked = boot({navigator: {clipboard: {writeText: async () => { throw {name: 'NotAllowedError'}; }}}});
    blocked.character('学校'); blocked.run('getSpark(); rateIdea("not-helpful")');
    await blocked.run('copyFeedback()');
    assert.equal(blocked.element('feedback-copy-fallback').hidden, false);
    assert(blocked.element('feedback-share-text').value.includes('Didn’t help'));
    assert.match(blocked.element('feedback-share-status').innerText, /copy.*paste/i);
});

test('empty reports are disabled and cannot open sharing or change the clipboard', async () => {
    const actions = [];
    const app = boot({navigator: {share: async () => actions.push('share'), clipboard: {writeText: async () => actions.push('copy')}}});
    assert.equal(app.element('share-feedback').disabled, true);
    assert.equal(app.element('copy-feedback').disabled, true);
    await app.run('shareFeedback(); copyFeedback()');
    assert.equal(actions.length, 0);
});

test('a pending share cannot open a second sheet and clearing feedback removes stale copy text', async () => {
    let finish;
    let calls = 0;
    const app = boot({navigator: {share: () => { calls++; return new Promise(resolve => { finish = resolve; }); }}});
    app.character('星际旅行'); app.run('getSpark()');
    const pending = app.run('shareFeedback()');
    await app.run('shareFeedback()');
    assert.equal(calls, 1);
    assert.equal(app.element('share-feedback').disabled, true);
    finish(); await pending;
    assert.equal(app.element('share-feedback').disabled, false);
    await app.run('copyFeedback()');
    assert.equal(app.element('feedback-copy-fallback').hidden, false);
    app.run('clearSavedFeedback()');
    assert.equal(app.element('feedback-copy-fallback').hidden, true);
    assert.equal(app.element('feedback-share-text').value, '');
    assert.equal(app.element('share-feedback').disabled, true);
});
