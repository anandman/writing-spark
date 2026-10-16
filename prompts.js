// English story cues for grades 2–4. The child supplies the story.
// Strategy tags keep successive suggestions varied.
// Chinese sentence ideas live in character-ideas.js.

const PROMPTS_CONFIG = {
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
