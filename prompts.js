// Thinking cues for grades 2–4. The child supplies the subject and the sentence.
// "Your character" and "your word" refer to the child's assignment; the app
// never collects them. Cards are optional, and some will not fit every task.
// Keep each cue short and leave out suggested plots or completed sentences.
// Strategy tags are internal: the interface still shows just one card.

const PROMPTS_CONFIG = {
    chinese: [
        // Association
        { strategy: "association", text: "Think of a word you know that uses this character." },
        { strategy: "association", text: "What other word does your word remind you of?" },
        { strategy: "association", text: "What does your word make you think of?" },
        { strategy: "association", text: "Could your word describe something you know?" },
        { strategy: "association", text: "Could your word fit something you do?" },

        // Memory
        { strategy: "memory", text: "When have you heard someone use your word?" },
        { strategy: "memory", text: "What have you done that reminds you of your word?" },
        { strategy: "memory", text: "Does your word remind you of a place you have been?" },
        { strategy: "memory", text: "Can you remember your word in a story you read?" },
        { strategy: "memory", text: "Could your word fit something you noticed today?" },

        // People
        { strategy: "people", text: "Who might use your word?" },
        { strategy: "people", text: "Could your sentence be about someone you know?" },
        { strategy: "people", text: "What might someone think about your idea?" },
        { strategy: "people", text: "How might someone feel in your sentence?" },
        { strategy: "people", text: "What might someone say in your sentence?" },

        // Imagination
        { strategy: "imagination", text: "What if something happened differently than usual?" },
        { strategy: "imagination", text: "Could your idea happen at a different time?" },
        { strategy: "imagination", text: "Could your idea happen in another place?" },
        { strategy: "imagination", text: "What would the opposite be?" },
        { strategy: "imagination", text: "Could something about your idea be surprising?" },

        // Senses
        { strategy: "senses", text: "Close your eyes. What does your word make you picture?" },
        { strategy: "senses", text: "What sound might go with your word?" },
        { strategy: "senses", text: "What color comes to mind with your word?" },
        { strategy: "senses", text: "Could your word connect to a smell?" },
        { strategy: "senses", text: "What might something in your sentence feel like to touch?" },

        // Details
        { strategy: "details", text: "Where could your idea happen?" },
        { strategy: "details", text: "When could your idea happen?" },
        { strategy: "details", text: "Why might it happen?" },
        { strategy: "details", text: "How might someone do it?" },
        { strategy: "details", text: "What could happen just before?" },

        // Structure
        { strategy: "structure", text: "Could you join two thoughts with 'because' (因为)?" },
        { strategy: "structure", text: "Could you say what happens 'first' (先) and 'then' (然后)?" },
        { strategy: "structure", text: "Could your sentence ask a question?" },
        { strategy: "structure", text: "Could you compare two things using 比?" },
        { strategy: "structure", text: "Could you start with 'I think' (我觉得)?" },

        // Speaking
        { strategy: "speaking", text: "Try saying your idea out loud." },
        { strategy: "speaking", text: "How would you explain your idea to someone you know?" },
        { strategy: "speaking", text: "Say the shortest version of your idea." },
        { strategy: "speaking", text: "Which part of your idea do you want to tell first?" },
        { strategy: "speaking", text: "Try saying your idea a different way." }
    ],

    english: [
        // Association
        { strategy: "association", text: "What does this part of your story remind you of?" },
        { strategy: "association", text: "What do you already know about your topic?" },
        { strategy: "association", text: "What word comes to mind when you think about your story?" },
        { strategy: "association", text: "What would you like to find out about your story?" },
        { strategy: "association", text: "What question could your next sentence answer?" },

        // Memory
        { strategy: "memory", text: "Have you ever felt the way someone in your story feels?" },
        { strategy: "memory", text: "Does your story remind you of somewhere you have been?" },
        { strategy: "memory", text: "What have you seen that could help you picture this moment?" },
        { strategy: "memory", text: "Can you remember hearing someone talk about something like this?" },
        { strategy: "memory", text: "Could something you noticed today fit your story?" },

        // People
        { strategy: "people", text: "What does someone in your story want?" },
        { strategy: "people", text: "What might someone in your story be thinking?" },
        { strategy: "people", text: "How does someone in your story feel right now?" },
        { strategy: "people", text: "What could someone in your story say?" },
        { strategy: "people", text: "How might someone else see the same moment?" },

        // Imagination
        { strategy: "imagination", text: "What else could happen next?" },
        { strategy: "imagination", text: "What if someone made a different choice?" },
        { strategy: "imagination", text: "What if the opposite happened?" },
        { strategy: "imagination", text: "Could this moment happen in a different place?" },
        { strategy: "imagination", text: "What might change as time passes?" },

        // Senses
        { strategy: "senses", text: "Close your eyes. What can you see in your story?" },
        { strategy: "senses", text: "What could someone hear in this moment?" },
        { strategy: "senses", text: "What could someone smell where your story happens?" },
        { strategy: "senses", text: "What might something in your story feel like to touch?" },
        { strategy: "senses", text: "What small detail catches your eye?" },

        // Details
        { strategy: "details", text: "Where exactly is this happening?" },
        { strategy: "details", text: "When is this happening?" },
        { strategy: "details", text: "Why did that happen?" },
        { strategy: "details", text: "How did someone do that?" },
        { strategy: "details", text: "What happened just before this moment?" },

        // Structure
        { strategy: "structure", text: "Could your next sentence be a question?" },
        { strategy: "structure", text: "Could 'because' help you explain something?" },
        { strategy: "structure", text: "Could 'meanwhile' connect two things happening at once?" },
        { strategy: "structure", text: "Could you tell what happens first and then what happens next?" },
        { strategy: "structure", text: "Could you compare something in your story to something else?" },

        // Speaking
        { strategy: "speaking", text: "Try saying your next sentence out loud." },
        { strategy: "speaking", text: "How would you tell this part to someone you know?" },
        { strategy: "speaking", text: "Say the shortest version of what happens next." },
        { strategy: "speaking", text: "Which part do you want to tell first?" },
        { strategy: "speaking", text: "Try saying your last idea a different way." }
    ]
};
