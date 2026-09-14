const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appSource = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const promptSource = fs.readFileSync(path.join(root, 'prompts.js'), 'utf8');

// Run the real app with a controllable clock and minimal browser/audio adapters.
function boot({ audio = true, resumeFails = false } = {}) {
    let now = 0;
    let nextInterval = 0;
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
                attributes: {}, value: '', open: false,
                classList: {
                    add: (...names) => names.forEach(name => classes.add(name)),
                    remove: (...names) => names.forEach(name => classes.delete(name)),
                    toggle(name, force) { if (force) classes.add(name); else classes.delete(name); },
                },
                setAttribute(name, value) { this.attributes[name] = value; },
                addEventListener() {},
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
        window: { AudioContext: audio ? AudioContext : undefined, addEventListener(name, fn) { events.set(name, fn); } },
        document: {
            body: element('body'), hidden: false,
            getElementById: element,
            querySelector: selector => element(selector),
            querySelectorAll: () => [element('main-wedge'), element('zen-wedge')],
            addEventListener(name, fn) { events.set(name, fn); },
        },
        Date: { now: () => now },
        setInterval(callback) { intervals.set(++nextInterval, callback); return nextInterval; },
        clearInterval(id) { intervals.delete(id); },
    });
    const run = code => vm.runInContext(code, context);
    run(promptSource);
    run(appSource);
    run('window.onload()');
    return {
        run, element, notes, events,
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
    app.run('getSpark()');
    app.tick(12500);
    app.run('getSpark()');
    assert.equal(app.digital(), '05:00');
    assert.equal(app.intervals(), 1);
    assert.equal(app.run('PROMPTS_CONFIG.chinese.some(prompt => prompt.text === document.getElementById("spark-display").innerText)'), true);
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

test('each mode shows every prompt before repeating, with varied strategies across refills', () => {
    const app = boot();
    app.run('let seed = 42; Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296)');
    for (const mode of ['chinese', 'english']) {
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

test('default decks keep all eight approaches available throughout each round', () => {
    const app = boot();
    for (const mode of ['chinese', 'english']) {
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
    for (const mode of ['chinese', 'english']) {
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
    app.run('getSpark()');
    const first = app.element('spark-display').innerText;
    app.run('setMode("english"); getSpark(); setMode("chinese"); getSpark()');
    assert.notEqual(app.element('spark-display').innerText, first);
    assert.equal(app.element('btn-chinese').attributes['aria-pressed'], 'true');
    assert.equal(app.element('btn-english').attributes['aria-pressed'], 'false');
});

test('timer completion leaves the current suggestion and deck in place', () => {
    const app = boot();
    app.run('getSpark()');
    const prompt = app.element('spark-display').innerText;
    const remaining = app.run('promptDecks.chinese.length');
    app.tick(300000);
    assert.equal(app.element('spark-display').innerText, prompt);
    assert.equal(app.run('promptDecks.chinese.length'), remaining);
    assert.equal(app.notes.length, 6);
});
