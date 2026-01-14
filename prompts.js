// prompts.js - The "Brain" of the operation
// You can add as many new prompts here as you like.

const PROMPTS_CONFIG = {
    // CHINESE: Goal = Expand sentences to 15+ characters
    // Categories allow us to potentially filter, but for now we mix them for variety.
    chinese: [
        // --- 1. The "W" Questions (Expansion) ---
        "Add a specific time (e.g., 'Last Tuesday at 3 PM').",
        "Add a location detail (e.g., 'Under the big oak tree').",
        "Explain WHY (Use 'because' / 因为).",
        "Explain HOW (Use 'carefully' or 'loudly').",
        "Who else was there? Add a friend or family member.",
        "Add a duration (How long did it take?).",

        // --- 2. Sensory Details (Descriptive) ---
        "Add a color word.",
        "Describe the sound (loud, quiet, buzzing).",
        "Describe the temperature (freezing, boiling).",
        "Is it heavy or light?",
        "Is it fast or slow?",
        "Describe the texture (rough, smooth, sticky).",

        // --- 3. Emotional/Opinion (Subjective) ---
        "Start with 'In my opinion' (我觉得).",
        "Add an emotion (excited, nervous, bored).",
        "Was it easy or difficult?",
        "Did you like it? Why?",
        "Start with 'Surprisingly' (竟然).",

        // --- 4. Complex Connectors (Structure) ---
        "Use 'Although... but...' (虽然...但是...).",
        "Use 'Not only... but also...' (不但...而且...).",
        "Use 'First... then...' (先...然后...).",
        "Use 'If... then...' (如果...就...).",
        "Use 'As soon as...' (一...就...).",
        "Use 'While' (一边...一边...).",

        // --- 5. Creative/Abstract (For harder words like 'Legislature') ---
        "Who would use this word? (A teacher? The President?)",
        "Is this something good or bad?",
        "Imagine this happened in the future.",
        "Imagine this happened 100 years ago.",
        "What is the opposite of this?",
        "Make the sentence about a mistake someone made.",
        "Make the sentence about a wish or dream."
    ],

    // ENGLISH: Goal = Sustain flow for 10-15 sentences
    english: [
        // --- 1. Transition Words (Flow) ---
        "Start the next sentence with 'However,'.",
        "Start the next sentence with 'Therefore,'.",
        "Start the next sentence with 'For instance,'.",
        "Start the next sentence with 'Suddenly,'.",
        "Start the next sentence with 'Meanwhile,'.",
        "Start the next sentence with 'In addition,'.",
        "Start the next sentence with 'Finally,'.",

        // --- 2. Deepening the Detail (Zoom In) ---
        "Zoom in on a small detail (a button, a sound, a smell).",
        "Describe the lighting in the scene.",
        "What was the weather like?",
        "What were your hands doing?",
        "What was happening in the background?",
        "Describe a color you saw.",
        "Describe a sound you heard.",

        // --- 3. Internal Monologue (Thoughts) ---
        "What were you thinking at that exact moment?",
        "What did you want to say but didn't?",
        "How did your body feel? (Heart racing? Tired?)",
        "Did you change your mind about anything?",
        "What was the most confusing part?",

        // --- 4. External Perspective (Zoom Out) ---
        "What would someone else say about this?",
        "Why does this matter?",
        "How did it end?",
        "Who helped you?",
        "What did you learn?",
        "How is this different from last time?",
        
        // --- 5. Oblique/Creative (The Brian Eno vibe) ---
        "Write a very short sentence. (3 words max)",
        "Write a very long sentence.",
        "Ask the reader a question.",
        "Use a metaphor or simile (It was like...).",
        "Repeat a word for emphasis.",
        "Be honest about a mistake.",
        "What if the opposite happened?"
    ]
};
