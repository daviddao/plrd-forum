/**
 * LessWrong's named reactions, extracted 1:1 from ForumMagnum's
 * lib/voting/reactions.tsx (labels, search terms, svg assets, filters).
 * Assets live in /public/reactionImages (Noun Project / Noto / OpenMoji,
 * see ForumMagnum's sources.txt for attribution).
 */
export type ReactionType = {
  name: string;
  label: string;
  svg: string;
  searchTerms: string[];
  description: string;
  filter: {
    padding?: number;
    opacity?: number;
    saturate?: number;
    scale?: number;
    translateX?: number;
    translateY?: number;
  } | null;
};

export const reactions: ReactionType[] = [
  {
    "name": "agree",
    "label": "Agreed",
    "svg": "/reactionImages/nounproject/check.svg",
    "searchTerms": [
      "check",
      "correct",
      "confirm",
      "upvote",
      "+1"
    ],
    "description": "Agreed",
    "filter": null
  },
  {
    "name": "disagree",
    "label": "Disagree",
    "svg": "/reactionImages/nounproject/x.svg",
    "searchTerms": [
      "x",
      "downvote",
      "-1"
    ],
    "description": "Disagree",
    "filter": null
  },
  {
    "name": "important",
    "label": "Important",
    "svg": "/reactionImages/nounproject/exclamation.svg",
    "searchTerms": [
      "!"
    ],
    "description": "Important",
    "filter": null
  },
  {
    "name": "insightful",
    "label": "Insightful",
    "svg": "/reactionImages/nounproject/lightbulb.svg",
    "searchTerms": [
      "lightbulb"
    ],
    "description": "This content adds insight to the conversation",
    "filter": null
  },
  {
    "name": "goodpoint",
    "label": "Good point!",
    "svg": "/reactionImages/nounproject/lightbulb.svg",
    "searchTerms": [
      "lightbulb",
      "good",
      "point",
      "insight"
    ],
    "description": "This content makes a good point",
    "filter": null
  },
  {
    "name": "changemind",
    "label": "Changed My Mind",
    "svg": "/reactionImages/nounproject/noun-triangle-305128.svg",
    "searchTerms": [
      "delta"
    ],
    "description": "Changed My Mind",
    "filter": {
      "opacity": 0.4,
      "scale": 1.4,
      "translateY": 1.0
    }
  },
  {
    "name": "thanks",
    "label": "Thanks",
    "svg": "/reactionImages/nounproject/thankyou.svg",
    "searchTerms": [
      "ty",
      "thanks",
      "gratitude"
    ],
    "description": "Thanks",
    "filter": {
      "opacity": 0.5,
      "scale": 0.9
    }
  },
  {
    "name": "support",
    "label": "Support",
    "svg": "/reactionImages/nounproject/pillar.svg",
    "searchTerms": [
      "pillar"
    ],
    "description": "Support",
    "filter": null
  },
  {
    "name": "verified",
    "label": "I checked, it's true",
    "svg": "/reactionImages/nounproject/verified.svg",
    "searchTerms": [
      "check",
      "correct",
      "confirm"
    ],
    "description": "I looked up sources, did empiricism, checked the equations, etc.",
    "filter": null
  },
  {
    "name": "verifiedFalse",
    "label": "I checked, it's False",
    "svg": "/reactionImages/nounproject/noun-cross-2014310.svg",
    "searchTerms": [
      "check",
      "correct",
      "confirm"
    ],
    "description": "I looked up sources, did empiricism, checked the equations, etc.",
    "filter": null
  },
  {
    "name": "betTrue",
    "label": "I'd bet this is true",
    "svg": "/reactionImages/nounproject/noun-dice-7011847.svg",
    "searchTerms": [
      "bet",
      "betting",
      "true"
    ],
    "description": "I'm willing to operationalize this, find an adjudicator, and bet this claim is true",
    "filter": null
  },
  {
    "name": "betFalse",
    "label": "I'd bet this is false",
    "svg": "/reactionImages/nounproject/noun-dice-7119510.svg",
    "searchTerms": [
      "bet",
      "betting",
      "false"
    ],
    "description": "I'm willing to operationalize this, find an adjudicator, and bet this claim is false",
    "filter": null
  },
  {
    "name": "surprise",
    "label": "Surprise",
    "svg": "/reactionImages/nounproject/surprise.svg",
    "searchTerms": [],
    "description": "I did not expect that!",
    "filter": {
      "opacity": 0.8
    }
  },
  {
    "name": "roll",
    "label": "Skeptical",
    "svg": "/reactionImages/nounproject/skeptical.svg",
    "searchTerms": [
      "examples",
      "shapes",
      "skeptical",
      "eyebrow",
      "dice",
      "roll",
      "disbelieve"
    ],
    "description": "I'm not sure I believe this.",
    "filter": {
      "opacity": 0.55,
      "scale": 1.1
    }
  },
  {
    "name": "yeswhatimean",
    "label": "Yes, that's my position",
    "svg": "/reactionImages/nounproject/clickingpointinghand.svg",
    "searchTerms": [
      "hand",
      "yes",
      "correct"
    ],
    "description": "Based on this, I think you've understood my/other person's position",
    "filter": {
      "opacity": 0.5
    }
  },
  {
    "name": "miss",
    "label": "Missed the point",
    "svg": "/reactionImages/nounproject/inaccurate.svg",
    "searchTerms": [],
    "description": "I think this misses what I (or the other person) actually believes and was trying to say or explain",
    "filter": null
  },
  {
    "name": "elaborate",
    "label": "Elaborate?",
    "svg": "/reactionImages/nounproject/noun-chat-1459491.svg",
    "searchTerms": [
      "questions"
    ],
    "description": "Elaborate?",
    "filter": {
      "opacity": 0.4
    }
  },
  {
    "name": "offtopic",
    "label": "Seems Offtopic?",
    "svg": "/reactionImages/nounproject/mapandpin.svg",
    "searchTerms": [
      "questions"
    ],
    "description": "I don't see how this is relevant to what's being discussed.",
    "filter": {
      "opacity": 1.0,
      "scale": 0.9
    }
  },
  {
    "name": "shakyPremise",
    "label": "Shaky Premise",
    "svg": "/reactionImages/nounproject/shakypremise.svg",
    "searchTerms": [
      "premise",
      "tower"
    ],
    "description": "This rests on shaky or false premises",
    "filter": null
  },
  {
    "name": "locallyInvalid",
    "label": "Locally Invalid",
    "svg": "/reactionImages/nounproject/negateddoubleturnstile.svg",
    "searchTerms": [
      "locally",
      "invalid",
      "unsound"
    ],
    "description": "This step is incorrect; these premises do not imply this conclusion.",
    "filter": null
  },
  {
    "name": "coveredAlready",
    "label": "I already addressed this",
    "svg": "/reactionImages/nounproject/noun-mail-checkmark-5316519.svg",
    "searchTerms": [
      "check",
      "already",
      "covered",
      "addressed",
      "addressed"
    ],
    "description": "I covered this in my post and/or comments.",
    "filter": {
      "opacity": 0.6,
      "scale": 1.2,
      "translateY": 2.0
    }
  },
  {
    "name": "unnecessarily-combative",
    "label": "Too Combative?",
    "svg": "/reactionImages/nounproject/swords.svg",
    "searchTerms": [
      "swords",
      "combative",
      "fighting",
      "battle",
      "war",
      "tribalism"
    ],
    "description": "This seems more combative than it needs to be to communicate its point.",
    "filter": {
      "padding": 2.0,
      "scale": 1.0
    }
  },
  {
    "name": "muddled",
    "label": "Difficult to Parse",
    "svg": "/reactionImages/nounproject/noun-fog-1028590.svg",
    "searchTerms": [
      "splat",
      "confused",
      "muddled"
    ],
    "description": "I had trouble reading this.",
    "filter": {
      "opacity": 0.7,
      "scale": 1.2
    }
  },
  {
    "name": "strawman",
    "label": "Misunderstands position?",
    "svg": "/reactionImages/nounproject/noun-misunderstanding-4936548-updated.svg",
    "searchTerms": [
      "examples",
      "scarecrow",
      "strawman",
      "misunderstanding",
      "position",
      "misrepresent"
    ],
    "description": "This seems to misunderstand the thing that it argues against",
    "filter": {
      "opacity": 0.5,
      "scale": 1.3,
      "translateX": 1.0,
      "translateY": 1.0
    }
  },
  {
    "name": "dontUnderstand",
    "label": "I don't understand",
    "svg": "/reactionImages/nounproject/noun-question-5771604.svg",
    "searchTerms": [
      "confused",
      "understand"
    ],
    "description": "I don't understand",
    "filter": {
      "scale": 0.9,
      "translateY": 2.0
    }
  },
  {
    "name": "locallyValid",
    "label": "Locally Valid",
    "svg": "/reactionImages/nounproject/doubleturnstile.svg",
    "searchTerms": [
      "locally",
      "valid",
      "sound"
    ],
    "description": "I think the reasoning is valid, independent of the premises or conclusion.",
    "filter": null
  },
  {
    "name": "notPlanningToRespond",
    "label": "Not Planning to Respond",
    "svg": "/reactionImages/nounproject/door.svg",
    "searchTerms": [
      "door",
      "respond",
      "planning"
    ],
    "description": "I'm not planning to respond further",
    "filter": null
  },
  {
    "name": "seen",
    "label": "I Saw This",
    "svg": "/reactionImages/nounproject/eyes.svg",
    "searchTerms": [
      "eyes"
    ],
    "description": "...and thought it'd be useful to let people know.",
    "filter": {
      "opacity": 0.8
    }
  },
  {
    "name": "empathy",
    "label": "Empathy",
    "svg": "/reactionImages/nounproject/noun-heart-1212629.svg",
    "searchTerms": [
      "heart"
    ],
    "description": "Empathy",
    "filter": {
      "opacity": 0.6,
      "scale": 1.05,
      "translateY": 1.0
    }
  },
  {
    "name": "heart",
    "label": "Heart",
    "svg": "/reactionImages/nounproject/noun-heart-1212629.svg",
    "searchTerms": [
      "empathy"
    ],
    "description": "Heart",
    "filter": {
      "opacity": 0.6,
      "scale": 1.05,
      "translateY": 1.0
    }
  },
  {
    "name": "crux",
    "label": "That's a crux",
    "svg": "/reactionImages/nounproject/branchingpath.svg",
    "searchTerms": [
      "identity",
      "matrix",
      "crux",
      "not"
    ],
    "description": "My other beliefs would be different if I had different beliefs about this",
    "filter": {
      "opacity": 0.6
    }
  },
  {
    "name": "notacrux",
    "label": "Not a crux",
    "svg": "/reactionImages/nounproject/nonbranchingpath2.svg",
    "searchTerms": [
      "identity",
      "matrix",
      "crux",
      "not"
    ],
    "description": "My other beliefs would not change if I had different beliefs about this",
    "filter": {
      "opacity": 0.6
    }
  },
  {
    "name": "prediction",
    "label": "What's your prediction?",
    "svg": "/reactionImages/nounproject/telescope.svg",
    "searchTerms": [
      "telescope",
      "prediction",
      "anticipation"
    ],
    "description": "What do you concretely expect to observe given your beliefs?",
    "filter": {
      "opacity": 0.4
    }
  },
  {
    "name": "examples",
    "label": "Examples?",
    "svg": "/reactionImages/nounproject/shapes.svg",
    "searchTerms": [
      "examples",
      "shapes"
    ],
    "description": "I'd be interested in seeing concrete examples of this",
    "filter": {
      "opacity": 0.6
    }
  },
  {
    "name": "additionalQuestions",
    "label": "Additional Questions",
    "svg": "/reactionImages/nounproject/elephant.svg",
    "searchTerms": [
      "elephant",
      "questions"
    ],
    "description": "I now have additional questions.",
    "filter": {
      "opacity": 0.8
    }
  },
  {
    "name": "taboo",
    "label": "Taboo those words?",
    "svg": "/reactionImages/nounproject/noun-cancel-chat-5735669.svg",
    "searchTerms": [
      "taboo",
      "shush",
      "quiet"
    ],
    "description": "Taboo those words?",
    "filter": {
      "opacity": 0.6,
      "translateY": 1.0
    }
  },
  {
    "name": "discussedAlready",
    "label": "This has already been discussed",
    "svg": "/reactionImages/nounproject/history2.svg",
    "searchTerms": [
      "clock",
      "history",
      "prior"
    ],
    "description": "Use Search, Concepts page, or ask in Open Thread if no one elaborates here.",
    "filter": {
      "opacity": 0.6
    }
  },
  {
    "name": "unnecessarily-harsh",
    "label": "Unnecessarily Harsh",
    "svg": "/reactionImages/nounproject/cactus.svg",
    "searchTerms": [
      "cactus",
      "prickly"
    ],
    "description": "This is harsh and didn't seem like it had to be.",
    "filter": null
  },
  {
    "name": "handshake",
    "label": "I Agree to This",
    "svg": "/reactionImages/nounproject/handshake.svg",
    "searchTerms": [
      "agreement"
    ],
    "description": "React to signal agreement (in the negotiation-y sense of the word)",
    "filter": {
      "opacity": 0.9
    }
  },
  {
    "name": "scout",
    "label": "Scout Mindset",
    "svg": "/reactionImages/nounproject/binoculars.svg",
    "searchTerms": [
      "binoculars"
    ],
    "description": "Good job focusing on figuring out what's true, rather than fighting for a side",
    "filter": null
  },
  {
    "name": "scholarship",
    "label": "Nice Scholarship!",
    "svg": "/reactionImages/nounproject/scholarship.svg",
    "searchTerms": [
      "cited"
    ],
    "description": "Good job looking into existing literature and citing sources",
    "filter": null
  },
  {
    "name": "concrete",
    "label": "Concrete",
    "svg": "/reactionImages/nounproject/concrete.svg",
    "searchTerms": [
      "bricks",
      "examples"
    ],
    "description": "This makes things more concrete by bringing in specifics or examples.",
    "filter": {
      "scale": 1.1
    }
  },
  {
    "name": "key",
    "label": "Key Insight",
    "svg": "/reactionImages/nounproject/key.svg",
    "searchTerms": [
      "insight"
    ],
    "description": "This is a key insight",
    "filter": null
  },
  {
    "name": "shrug",
    "label": "Unsure",
    "svg": "/reactionImages/nounproject/shrug.svg",
    "searchTerms": [],
    "description": "I don't know what to think of this",
    "filter": null
  },
  {
    "name": "scales",
    "label": "Seems Borderline",
    "svg": "/reactionImages/nounproject/scales.svg",
    "searchTerms": [
      "balanced"
    ],
    "description": "I think this could go either way",
    "filter": null
  },
  {
    "name": "thinking",
    "label": "Thinking",
    "svg": "/reactionImages/nounproject/thinking-nice-eyebrows.svg",
    "searchTerms": [],
    "description": "Food for thought",
    "filter": {
      "opacity": 1.0,
      "scale": 1.4,
      "translateY": 2.6
    }
  },
  {
    "name": "obtuse",
    "label": "Obtuse",
    "svg": "/reactionImages/nounproject/obtuse.svg",
    "searchTerms": [],
    "description": "This conversation is suffering from an acute lack of understanding. Your interpretation of the other person's position is not right. Try coming at this conversation from a different angle.",
    "filter": null
  },
  {
    "name": "nonSequitur",
    "label": "Non Sequitur",
    "svg": "/reactionImages/nounproject/nonsequitur.svg",
    "searchTerms": [
      "sequitur",
      "jump"
    ],
    "description": "This doesn't follow from the previous claim",
    "filter": null
  },
  {
    "name": "tooManyAssumptions",
    "label": "Too Many Assumptions",
    "svg": "/reactionImages/nounproject/houseofcards.svg",
    "searchTerms": [
      "cards",
      "house",
      "assumptions"
    ],
    "description": "This makes too many assumptions",
    "filter": {
      "opacity": 0.8
    }
  },
  {
    "name": "hitsTheMark",
    "label": "Hits the Mark",
    "svg": "/reactionImages/nounproject/bullseye.svg",
    "searchTerms": [
      "bullseye",
      "accurate"
    ],
    "description": "This hits the mark",
    "filter": null
  },
  {
    "name": "timecost",
    "label": "Not worth getting into?",
    "svg": "/reactionImages/nounproject/timequestion.svg",
    "searchTerms": [
      "time cost"
    ],
    "description": "I'm guessing it's probably not worth the time to resolve this?",
    "filter": {
      "scale": 0.8
    }
  },
  {
    "name": "excitement",
    "label": "Exciting",
    "svg": "/reactionImages/nounproject/partypopper.svg",
    "searchTerms": [
      "partypopper",
      "!"
    ],
    "description": "This is exciting!",
    "filter": {
      "translateY": -1.0
    }
  },
  {
    "name": "paperclip",
    "label": "Paperclip",
    "svg": "/reactionImages/nounproject/paperclip.svg",
    "searchTerms": [
      "paperclip"
    ],
    "description": "Paperclip",
    "filter": null
  },
  {
    "name": "clear",
    "label": "Clearly Written",
    "svg": "/reactionImages/nounproject/noun-clear-sky-1958882.svg",
    "searchTerms": [
      "clarity",
      "gem",
      "diamond"
    ],
    "description": "I had an easy time understanding this",
    "filter": {
      "opacity": 0.7,
      "scale": 1.2
    }
  },
  {
    "name": "typo",
    "label": "Typo",
    "svg": "/reactionImages/nounproject/type-text.svg",
    "searchTerms": [
      "typo",
      "error",
      "mistake",
      "mispelling",
      "spelling"
    ],
    "description": "Typo",
    "filter": {
      "scale": 0.9,
      "translateY": 2.0
    }
  },
  {
    "name": "laugh",
    "label": "Haha!",
    "svg": "/reactionImages/nounproject/noun-laughing-761845.svg",
    "searchTerms": [
      "laugh",
      "haha",
      "funny",
      "lol"
    ],
    "description": "Haha!",
    "filter": {
      "opacity": 0.9,
      "scale": 1.4,
      "translateY": 2.0
    }
  },
  {
    "name": "disappointed",
    "label": "Disappointed",
    "svg": "/reactionImages/nounproject/noun-sad-5760577.svg",
    "searchTerms": [
      "disappointed",
      "sad",
      "frown"
    ],
    "description": "Disappointed",
    "filter": {
      "opacity": 0.9,
      "translateY": 2.0
    }
  },
  {
    "name": "sad",
    "label": "Sad",
    "svg": "/reactionImages/nounproject/noun-sad-1152961.svg",
    "searchTerms": [
      "sad",
      "frown"
    ],
    "description": "Sad",
    "filter": {
      "opacity": 0.7,
      "scale": 1.4,
      "translateY": 2.5
    }
  },
  {
    "name": "confused",
    "label": "I notice I'm confused",
    "svg": "/reactionImages/confused2.svg",
    "searchTerms": [
      "confused",
      "question",
      "questionmark",
      "bewildered"
    ],
    "description": "I don't have a clear explanation of what's going on here",
    "filter": {
      "opacity": 0.9,
      "scale": 1.0,
      "translateX": 0.0,
      "translateY": -2.5
    }
  },
  {
    "name": "smile",
    "label": "Smile",
    "svg": "/reactionImages/nounproject/noun-smile-925549.svg",
    "searchTerms": [
      "smile",
      "happy",
      "grin"
    ],
    "description": "This makes me happy. :)",
    "filter": {
      "opacity": 0.5,
      "scale": 1.4,
      "translateY": 2.0
    }
  },
  {
    "name": "facilitation",
    "label": "Good Facilitation",
    "svg": "/reactionImages/nounproject/noun-dialog-2172.svg",
    "searchTerms": [
      "understanding",
      "helpful",
      "facilitation",
      "charitable"
    ],
    "description": "This seemed to help people understand each other",
    "filter": {
      "scale": 1.3,
      "translateY": 2.0
    }
  },
  {
    "name": "soldier",
    "label": "Soldier Mindset",
    "svg": "/reactionImages/nounproject/noun-soldier-5069240.svg",
    "searchTerms": [],
    "description": "This seems to be trying to fight for a side rather than figure out what's true",
    "filter": {
      "opacity": 0.7,
      "scale": 1.2,
      "translateY": 1.0
    }
  },
  {
    "name": "thumbs-up",
    "label": "Thumbs Up",
    "svg": "/reactionImages/nounproject/noun-thumbs-up-1686284.svg",
    "searchTerms": [],
    "description": "I saw this, and feel vaguely good about it",
    "filter": {
      "opacity": 0.5,
      "translateY": 2.0
    }
  },
  {
    "name": "thumbs-down",
    "label": "Thumbs Down",
    "svg": "/reactionImages/nounproject/noun-thumbs-down-1686285.svg",
    "searchTerms": [],
    "description": "I saw this, and vaguely dislike it",
    "filter": {
      "opacity": 0.5,
      "translateY": 3.0
    }
  },
  {
    "name": "1percent",
    "label": "Less than 1% likely",
    "svg": "/reactionImages/1percent.svg",
    "searchTerms": [],
    "description": "Less than 1% likely",
    "filter": {
      "opacity": 0.5,
      "scale": 1.4,
      "translateX": 0.5,
      "translateY": 0.75
    }
  },
  {
    "name": "10percent",
    "label": "10% likely",
    "svg": "/reactionImages/10percent.svg",
    "searchTerms": [],
    "description": "10% likely",
    "filter": {
      "opacity": 0.5,
      "scale": 1.4,
      "translateX": 0.5,
      "translateY": 0.75
    }
  },
  {
    "name": "25percent",
    "label": "~25% likely",
    "svg": "/reactionImages/25percent.svg",
    "searchTerms": [],
    "description": "~25% likely",
    "filter": {
      "opacity": 0.5,
      "scale": 1.4,
      "translateX": 0.5,
      "translateY": 1.25
    }
  },
  {
    "name": "40percent",
    "label": "~40% likely",
    "svg": "/reactionImages/40percent.svg",
    "searchTerms": [],
    "description": "~40% likely",
    "filter": {
      "opacity": 0.5,
      "scale": 1.4,
      "translateX": 0.5,
      "translateY": 0.75
    }
  },
  {
    "name": "50percent",
    "label": "~50% likely",
    "svg": "/reactionImages/50percent.svg",
    "searchTerms": [],
    "description": "~50% likely",
    "filter": {
      "opacity": 0.5,
      "scale": 1.4,
      "translateX": 0.5,
      "translateY": 0.75
    }
  },
  {
    "name": "60percent",
    "label": "~60% likely",
    "svg": "/reactionImages/60percent.svg",
    "searchTerms": [],
    "description": "~60% likely",
    "filter": {
      "opacity": 0.5,
      "scale": 1.4,
      "translateX": 0.5,
      "translateY": 0.75
    }
  },
  {
    "name": "75percent",
    "label": "~75% likely",
    "svg": "/reactionImages/75percent.svg",
    "searchTerms": [],
    "description": "~75% likely",
    "filter": {
      "opacity": 0.5,
      "scale": 1.4,
      "translateX": 0.5,
      "translateY": 0.75
    }
  },
  {
    "name": "90percent",
    "label": "~90% likely",
    "svg": "/reactionImages/90percent.svg",
    "searchTerms": [],
    "description": "~90% likely",
    "filter": {
      "opacity": 0.5,
      "scale": 1.4,
      "translateX": 0.5,
      "translateY": 0.75
    }
  },
  {
    "name": "99percent",
    "label": "99+% likely",
    "svg": "/reactionImages/99percent.svg",
    "searchTerms": [],
    "description": "99+% likely",
    "filter": {
      "opacity": 0.5,
      "scale": 1.25,
      "translateX": 1.0,
      "translateY": 0.75
    }
  },
  {
    "name": "why",
    "label": "Why? / Citation?",
    "svg": "/reactionImages/nounproject/noun-brackets-1942334-updated.svg",
    "searchTerms": [
      "why",
      "citation",
      "source",
      "needed",
      "question"
    ],
    "description": "Why do you believe that? Or, what's your source for that?",
    "filter": {
      "scale": 1.2
    }
  },
  {
    "name": "moloch",
    "label": "Moloch",
    "svg": "/reactionImages/nounproject/moloch-bw-2.svg",
    "searchTerms": [
      "moloch",
      "coordination",
      "tragedy",
      "commons"
    ],
    "description": "Moloch",
    "filter": {
      "opacity": 0.5,
      "scale": 1.1,
      "translateY": -1.0
    }
  },
  {
    "name": "plus",
    "label": "Plus One",
    "svg": "/reactionImages/nounproject/Plus.png",
    "searchTerms": [
      "plus",
      "one",
      "agree",
      "same",
      "position"
    ],
    "description": "Plus One",
    "filter": {
      "opacity": 0.5,
      "scale": 1.2
    }
  },
  {
    "name": "llm-smell",
    "label": "Smells like LLM",
    "svg": "/reactionImages/nounproject/llm-smell.svg",
    "searchTerms": [
      "llm",
      "ai",
      "language model",
      "chatgpt",
      "gpt",
      "generated"
    ],
    "description": "This reads to me like it could've been written by a language model.",
    "filter": {
      "opacity": 0.6,
      "saturate": 0.6,
      "scale": 1.3
    }
  },
  {
    "name": "changed-mind-on-point",
    "label": "Changed My Mind\\n(on this point)",
    "svg": "/reactionImages/nounproject/changedmindonpoint.svg",
    "searchTerms": [
      "changed",
      "mind",
      "point",
      "specific",
      "delta"
    ],
    "description": "I've changed my mind on this particular point (not necessarily on any larger claims).",
    "filter": {
      "scale": 1.2,
      "translateX": 0.4
    }
  },
  {
    "name": "resolved",
    "label": "Question Answered",
    "svg": "/reactionImages/nounproject/resolved.svg",
    "searchTerms": [
      "resolved",
      "question",
      "confusion",
      "clear",
      "understood"
    ],
    "description": "This resolved my question! Thanks.",
    "filter": {
      "opacity": 0.7,
      "scale": 1.3
    }
  },
  {
    "name": "sneer",
    "label": "Too Sneering?",
    "svg": "/reactionImages/nounproject/NoSneeringThick.png",
    "searchTerms": [
      "sneer",
      "disrespect",
      "derision",
      "contempt",
      "mocking"
    ],
    "description": "This is too much sneering (signaling disrespect and derision) relative to its substantive critique.",
    "filter": {
      "opacity": 0.8
    }
  },
  {
    "name": "strong-argument",
    "label": "Strong Argument",
    "svg": "/reactionImages/nounproject/strong-argument2.svg",
    "searchTerms": [
      "strong",
      "argument",
      "convincing",
      "persuasive",
      "solid"
    ],
    "description": "This is a strong, well-reasoned argument.",
    "filter": {
      "opacity": 0.5,
      "scale": 1.3
    }
  },
  {
    "name": "weak-argument",
    "label": "Weak Argument",
    "svg": "/reactionImages/nounproject/weak-argument2.svg",
    "searchTerms": [
      "weak",
      "argument",
      "unconvincing",
      "flimsy",
      "poor"
    ],
    "description": "This argument is weak or poorly reasoned.",
    "filter": {
      "opacity": 0.5,
      "scale": 1.3
    }
  },
  {
    "name": "bet",
    "label": "Let's make a bet!",
    "svg": "/reactionImages/nounproject/bet.svg",
    "searchTerms": [
      "bet",
      "betting",
      "wager",
      "challenge"
    ],
    "description": "I'm willing to put money on this claim!",
    "filter": {
      "opacity": 0.8,
      "scale": 1.2
    }
  },
  {
    "name": "hat",
    "label": "Bowing Out",
    "svg": "/reactionImages/nounproject/HatInMotion.png",
    "searchTerms": [
      "bow",
      "out",
      "goodbye",
      "exit",
      "leave"
    ],
    "description": "I'm bowing out of this thread at this point. Goodbye for now!",
    "filter": {
      "opacity": 0.7,
      "scale": 1.5
    }
  },
  {
    "name": "nitpick",
    "label": "Nitpick",
    "svg": "/reactionImages/nounproject/nitpick.svg",
    "searchTerms": [
      "nitpick",
      "minor",
      "unimportant",
      "trivial",
      "detail"
    ],
    "description": "This seems like it's focusing on a relatively unimportant point.",
    "filter": {
      "opacity": 0.5,
      "scale": 1.1
    }
  },
  {
    "name": "addc",
    "label": "Agree Denotationally, Disagree Connotationally",
    "svg": "/reactionImages/nounproject/ADDC.svg",
    "searchTerms": [
      "agree",
      "denotation",
      "disagree",
      "connotation",
      "subtext",
      "meaning"
    ],
    "description": "I agree with the explicit meaning of these words, but I don't agree with what I read as the subtext here.",
    "filter": {
      "opacity": 0.5,
      "scale": 1.2
    }
  },
  {
    "name": "beautiful",
    "label": "Beautiful!",
    "svg": "/reactionImages/Beautiful.svg",
    "searchTerms": [
      "beautiful",
      "gorgeous",
      "stunning",
      "lovely",
      "aesthetic"
    ],
    "description": "Beautiful!",
    "filter": {
      "opacity": 1.0,
      "scale": 1.2
    }
  },
  {
    "name": "oops",
    "label": "Oops!",
    "svg": "/reactionImages/nounproject/Oops!.png",
    "searchTerms": [
      "oops",
      "mistake",
      "error",
      "whoops",
      "accident"
    ],
    "description": "Oops! I made a mistake or error.",
    "filter": {
      "opacity": 1.0,
      "scale": 1.3,
      "translateY": 1.0
    }
  },
  {
    "name": "coveredAlready2",
    "label": "Already addressed",
    "svg": "/reactionImages/nounproject/noun-mail-checkmark-5316519.svg",
    "searchTerms": [
      "check",
      "already",
      "covered",
      "addressed",
      "addressed"
    ],
    "description": "This has been covered earlier in the post or comment thread.",
    "filter": {
      "opacity": 0.6,
      "scale": 1.2,
      "translateY": 2.0
    }
  }
];

export const reactionsByLabel = new Map(reactions.map((r) => [r.label.toLowerCase(), r]));

/** LW's defaultFilter: opacity .4, saturate .6 (icons render greyish until hover) */
export const reactionFilterCss = (r: ReactionType): string => {
  const f = r.filter ?? {};
  return `opacity(${f.opacity ?? 1}) saturate(${f.saturate ?? 1})`;
};

export const reactionScaleCss = (r: ReactionType): string | undefined => {
  const f = r.filter ?? {};
  const parts: string[] = [];
  if (f.scale) parts.push(`scale(${f.scale})`);
  if (f.translateX) parts.push(`translateX(${f.translateX}px)`);
  if (f.translateY) parts.push(`translateY(${f.translateY}px)`);
  return parts.length ? parts.join(" ") : undefined;
};

/* LW's curated palette ordering (lib/voting/curatedReactionsList.ts) */
export const gridPrimary = [
  "agree", "disagree", "important", "dontUnderstand", "plus", "shrug", "thumbs-up", "thumbs-down", "seen",
];
export const gridEmotions = [
  "smile", "laugh", "sad", "disappointed", "confused", "thinking", "oops", "surprise", "excitement",
];
export const gridSectionB = [
  "changemind", "strong-argument", "crux", "hitsTheMark", "clear", "concrete", "scout", "moloch", "why",
  "changed-mind-on-point", "weak-argument", "notacrux", "miss", "muddled", "examples", "soldier", "paperclip", "resolved",
];
export const gridSectionC = [
  "heart", "coveredAlready2", "beautiful", "goodpoint", "strawman", "addc", "llm-smell", "scholarship", "unnecessarily-combative",
  "thanks", "hat", "nitpick", "offtopic", "facilitation", "bowels", "typo", "bet", "sneer",
];
export const likelihoods = [
  "1percent", "10percent", "25percent", "40percent", "50percent", "60percent", "75percent", "90percent", "99percent",
];

const byName = new Map(reactions.map((r) => [r.name, r]));
export const getReaction = (name: string) => byName.get(name);
export const paletteSections: { title: string | null; names: string[] }[] = [
  { title: null, names: gridPrimary },
  { title: null, names: gridEmotions },
  { title: null, names: gridSectionB },
  { title: null, names: gridSectionC },
  { title: "How likely is this?", names: likelihoods },
];
