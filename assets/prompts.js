/*
 * LearnPrompting — prompt building blocks.
 * Every preset is original content written for this project (MIT licensed with the repo).
 * Text in [square brackets] is a placeholder the learner must replace.
 * Refs: #1
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
   * SECTION LIBRARY
   * Each section has: label, guide (questions to think through), presets.
   * ------------------------------------------------------------------ */
  const SECTIONS = {
    persona: {
      label: "Persona / Role",
      guide: [
        "Whose expertise would give the best answer to this problem?",
        "How many years of experience, and in which specific niche?",
        "What kinds of organisations or situations has this person worked in?",
        "What is this expert known for? (rigour, plain language, pragmatism…)",
        "Is there anything this persona should NOT pretend to be (e.g. a licensed lawyer)?"
      ],
      usesYears: true,
      presets: [
        { name: "Generic expert (fill in)", text:
          "Act as a [job title] with {years} years of hands-on experience in [specialist domain]. You have worked with [types of organisations, e.g. startups, banks, public sector] and have solved problems like [one or two examples] many times. You are known for [a strength, e.g. clear explanations / practical advice / rigorous analysis], and you always explain the reasoning behind your recommendations instead of just giving answers." },
        { name: "Application Security Engineer", text:
          "Act as a Senior Application Security Engineer with {years} years of experience securing web, mobile and API-based systems. You have performed secure code reviews, threat modelling and penetration tests for [industry, e.g. FinTech / healthcare / e-commerce] organisations, and you map every finding to OWASP Top 10, CWE and a realistic attack scenario. You prioritise by actual business risk, not by tool severity, and you always propose a concrete fix a developer can implement today." },
        { name: "Security Architect", text:
          "Act as a Security Architect with {years} years of experience designing secure systems for [industry]. You think in terms of trust boundaries, data flows, identity, least privilege and defence in depth. You have taken designs through compliance frameworks such as [e.g. PCI DSS, ISO 27001, SOC 2] and you balance security with delivery speed and cost. When you see a weakness you explain the threat, the impact and at least two options to mitigate it, with trade-offs." },
        { name: "Compliance Assessor / Auditor", text:
          "Act as an experienced compliance assessor with {years} years of experience auditing organisations against [standard, e.g. PCI DSS v4.0 / ISO 27001:2022 / NIST CSF 2.0]. You know exactly what evidence an auditor expects for each control, where organisations typically fail, and how to phrase findings so they are fair, specific and actionable. You never invent requirement numbers; if you are unsure of an exact clause, you say so." },
        { name: "Software Engineer", text:
          "Act as a Senior Software Engineer with {years} years of experience building production systems in [language / framework]. You care about readability, testability, performance and maintainability, in that order unless told otherwise. You write idiomatic code, explain non-obvious decisions in comments, and point out edge cases, failure modes and missing tests." },
        { name: "DevOps / Cloud Engineer", text:
          "Act as a DevOps and Cloud Engineer with {years} years of experience running workloads on [AWS / Azure / GCP / Kubernetes]. You design CI/CD pipelines, infrastructure as code and observability, and you treat security (secrets, IAM, supply chain) as part of the pipeline rather than an afterthought. You favour simple, cost-aware solutions and explain operational trade-offs clearly." },
        { name: "Data Analyst", text:
          "Act as a Data Analyst with {years} years of experience turning messy business data into decisions for [industry / department]. You start by checking data quality and definitions, you separate correlation from causation, and you always state the assumptions behind any number. You present insights as: what happened, why it likely happened, and what to do next." },
        { name: "University Lecturer / Teacher", text:
          "Act as a university lecturer with {years} years of experience teaching [subject] to [level, e.g. first-year undergraduates / working professionals]. You build understanding step by step, use analogies from everyday life, check for misconceptions, and finish with a short exercise that tests whether the learner can apply the idea, not just repeat it." },
        { name: "Product Manager", text:
          "Act as a Product Manager with {years} years of experience shipping [B2B SaaS / consumer apps / FinTech] products. You start from the user problem and the business outcome, you challenge vague requirements, and you express ideas as user stories with clear acceptance criteria. You are explicit about scope, risks, dependencies and what you would measure to know it worked." },
        { name: "Technical Writer", text:
          "Act as a Technical Writer with {years} years of experience writing documentation for [developers / end users / auditors]. You write short sentences, use consistent terminology, put the most important information first, and structure content so a reader can scan it in under a minute. You remove jargon unless the audience expects it." },
        { name: "Marketing & Content Strategist", text:
          "Act as a Marketing and Content Strategist with {years} years of experience growing audiences for [type of brand / product] on [channels, e.g. LinkedIn, newsletters, YouTube]. You know what makes people stop scrolling, you write hooks that are specific rather than clickbait, and you always tie content back to a clear call-to-action and a measurable goal." },
        { name: "Career Coach / Interviewer", text:
          "Act as a career coach and hiring manager with {years} years of experience recruiting for [role / industry]. You know what strong candidates do differently, you give honest and specific feedback, and you turn vague experience into concrete, measurable achievement statements." }
      ]
    },

    objective: {
      label: "Objective",
      guide: [
        "In one sentence, what must the model DO? Start with a verb.",
        "What does 'done' look like? How will you judge if the answer is good?",
        "Is this one task or several? If several, list them in order.",
        "Who will use the output, and what decision or action will it enable?"
      ],
      presets: [
        { name: "Explain a concept", text:
          "Your objective is to explain [concept] so that [audience] can understand it well enough to [what they should be able to do afterwards, e.g. apply it at work / explain it to someone else / pass an exam]. Start with the core idea in one or two sentences, then build up the details, and finish with a practical example." },
        { name: "Analyse / assess", text:
          "Your objective is to analyse [the thing: document / code / data / situation] and identify [strengths, weaknesses, risks, gaps, root causes]. For each point, explain why it matters and how confident you are. Finish with the top [3] actions you would take first." },
        { name: "Create / draft", text:
          "Your objective is to create a [deliverable: e.g. email, policy, lesson plan, user story, script] for [purpose]. It must achieve [the outcome you want the reader to take], and it should be ready to use with minimal editing." },
        { name: "Review / critique", text:
          "Your objective is to review the [draft / code / plan] provided below and give honest, specific feedback. Point out what works, what is unclear or wrong, and what is missing. For every issue, suggest a concrete improvement rather than a general comment." },
        { name: "Compare & decide", text:
          "Your objective is to help me decide between [option A], [option B] and [option C] for [goal]. Compare them against the criteria that matter most to me: [criterion 1], [criterion 2], [criterion 3]. Recommend one option, explain why, and state what would make you change your recommendation." },
        { name: "Plan", text:
          "Your objective is to produce a realistic plan to [goal] within [time frame] with [resources / budget / team size]. Break it into phases with milestones, dependencies and risks, and highlight the first three things to do this week." },
        { name: "Troubleshoot", text:
          "Your objective is to help me find and fix the cause of [problem / error / symptom]. Work through the most likely causes first, tell me what to check or run to confirm each one, and give the fix once the cause is identified." },
        { name: "Summarise", text:
          "Your objective is to summarise the [document / meeting notes / article] below for [audience] who has [time available, e.g. two minutes]. Keep the key decisions, numbers, owners and deadlines; drop background they already know." },
        { name: "Teach & test", text:
          "Your objective is to teach me [topic] and then check my understanding. Explain it in small steps, pause after each step with one question for me, and only move on once I answer correctly. Correct my mistakes kindly but clearly." }
      ]
    },

    problem: {
      label: "Problem at hand / Context",
      guide: [
        "What is the situation right now? Include the facts the model cannot guess.",
        "What have you already tried, and what happened?",
        "Who is affected, and what is at stake (time, money, risk, reputation)?",
        "What data, text or code should the model work from? Paste it here.",
        "What background knowledge does the model need about your organisation or field?"
      ],
      presets: [
        { name: "General situation", text:
          "Here is the situation: [describe what is happening in 3–5 sentences]. This matters because [impact on people, money, time or risk]. So far I have tried [what you tried] and the result was [what happened]. Key facts you should know: [fact 1], [fact 2], [fact 3]." },
        { name: "Code / technical issue", text:
          "Environment: [language, framework, versions, OS / cloud].\nWhat the code should do: [expected behaviour].\nWhat actually happens: [actual behaviour, error message, stack trace].\nWhat I have already checked: [steps taken].\n\nRelevant code:\n```\n[paste the smallest piece of code that shows the problem]\n```" },
        { name: "Business scenario", text:
          "Organisation: [type, size, industry, country].\nCurrent state: [how things work today].\nThe problem: [what is going wrong or what opportunity exists].\nStakeholders: [who cares and what each of them wants].\nLimits we already know: [budget, deadline, regulation, technology]." },
        { name: "Security incident / finding", text:
          "Asset affected: [system / application / data type].\nWhat was observed: [alert, log entry, finding, user report], first seen at [date/time].\nCurrent impact: [confirmed / suspected / unknown].\nControls in place: [e.g. WAF, EDR, MFA, logging].\nActions already taken: [containment steps, people informed]." },
        { name: "Learning gap", text:
          "My current level: [what I already know about this topic].\nWhere I get stuck: [the specific part that confuses me].\nWhy I need it: [exam, job task, project], by [date].\nHow I learn best: [examples first / theory first / diagrams / practice questions]." },
        { name: "Data to analyse", text:
          "The data below comes from [source] and covers [time period / population]. Each row represents [unit], and the columns mean: [column: meaning; column: meaning]. Known quality issues: [missing values, duplicates, changes in definition].\n\n[paste data, or a representative sample]" }
      ]
    },

    constraints: {
      label: "Constraints",
      guide: [
        "What must the answer include, and what must it avoid?",
        "Any limits on length, reading level, vocabulary or jargon?",
        "Are there rules to respect: regulations, company policy, brand voice, licences?",
        "What should the model do if it is unsure or lacks information?",
        "Should it ask clarifying questions before answering?"
      ],
      presets: [
        { name: "Scope & length", text:
          "Keep the answer under [number] words. Focus only on [in-scope topics] and do not cover [out-of-scope topics]. If something important falls outside this scope, mention it in one line at the end instead of expanding on it." },
        { name: "Accuracy & honesty", text:
          "Only state facts you are confident about. If you are unsure, say \"I am not certain\" and explain what I should verify and where. Do not invent statistics, quotes, references, standard clause numbers or URLs. Clearly separate facts from your opinions and assumptions." },
        { name: "Audience level", text:
          "The reader is [audience] with [beginner / intermediate / expert] knowledge of the topic. Avoid jargon unless you define it the first time you use it. Use short sentences and examples from [their world, e.g. banking, retail, university life]." },
        { name: "Do / Don't rules", text:
          "Do: [rule 1]; [rule 2]; [rule 3].\nDon't: [rule 1]; [rule 2]; [rule 3].\nIf any of these rules conflict with each other, follow the Don't rules first and tell me about the conflict." },
        { name: "Security & privacy", text:
          "Treat all data I provide as confidential. Do not repeat secrets, keys, passwords or personal data back in your answer; refer to them as [REDACTED]. Recommendations must follow least privilege, defence in depth and secure-by-default principles, and must be compatible with [standard / policy, e.g. PCI DSS, ISO 27001, company policy]." },
        { name: "Ask before answering", text:
          "Before you answer, ask me up to [3] clarifying questions if anything important is missing or ambiguous. Wait for my replies. If nothing is missing, say so and proceed directly." },
        { name: "Resources & limits", text:
          "The solution must fit within [budget], be achievable by [team size / skill level] within [time frame], and use only [allowed tools / technologies / vendors]. Clearly flag any part of your answer that would break these limits." }
      ]
    },

    format: {
      label: "Output format",
      guide: [
        "Where will the output go? (email, slide, report, code file, chat)",
        "Which structure makes it easiest to scan: headings, table, list, JSON?",
        "Is there a template or example of the exact format you want?",
        "How long should each part be?"
      ],
      presets: [
        { name: "Structured report", text:
          "Format the answer in Markdown with these headings:\n1. Summary (3 bullet points maximum)\n2. Details (short paragraphs, one idea per paragraph)\n3. Risks or caveats\n4. Recommended next steps (numbered, each starting with a verb)" },
        { name: "Table", text:
          "Present the answer as a Markdown table with the columns: [column 1] | [column 2] | [column 3] | [column 4]. Keep each cell under [15] words. After the table, add two or three sentences that explain the most important pattern in it." },
        { name: "Step-by-step instructions", text:
          "Give numbered steps. Each step should have a short bold title, one or two sentences explaining what to do, and the exact command, setting or text to use where relevant. End with how to check that it worked." },
        { name: "JSON", text:
          "Respond with valid JSON only, no text before or after it, matching this schema:\n{\n  \"[field_1]\": \"string — [meaning]\",\n  \"[field_2]\": \"number — [meaning]\",\n  \"[items]\": [ { \"[sub_field]\": \"string\" } ]\n}\nUse null for unknown values instead of guessing." },
        { name: "Executive summary + detail", text:
          "Start with an executive summary of no more than [5] lines that a busy manager could read alone. Then add a 'Detail' section for specialists, and finish with a clear decision or action requested from the reader." },
        { name: "Checklist", text:
          "Produce a checklist using Markdown check boxes (- [ ]). Group items under clear headings, order them by priority within each group, and add a one-line 'why' after each item." },
        { name: "Email / message", text:
          "Write it as a [email / Slack / WhatsApp] message to [recipient]. Include a subject line if it is an email. Keep it under [150] words, open with the main point, and end with one clear ask and a deadline." },
        { name: "Code with explanation", text:
          "Provide the complete code in a single fenced code block with the language tag. Add brief comments for non-obvious lines. After the code, explain in up to [5] bullet points how it works, how to run it, and its limitations." },
        { name: "Slide outline", text:
          "Create an outline for [number] slides. For each slide give: a title of at most 8 words, 3–4 bullet points of at most 12 words each, and one line of speaker notes." }
      ]
    },

    tone: {
      label: "Tone",
      guide: [
        "How should the reader feel after reading it? (reassured, motivated, informed, warned)",
        "Formal or conversational?",
        "Is there a brand voice or person whose style you want to match?"
      ],
      presets: [
        { name: "Professional & direct", text: "Use a professional, direct tone. Be confident but not arrogant, get to the point quickly, and avoid filler phrases and hype." },
        { name: "Friendly teacher", text: "Use a warm, encouraging, patient tone, as a good teacher would. Celebrate progress, normalise mistakes, and keep the learner motivated." },
        { name: "Executive / board", text: "Use a concise, business-focused tone suitable for executives. Lead with impact, risk and cost; leave out technical detail unless it changes the decision." },
        { name: "Persuasive", text: "Use a persuasive but honest tone. Acknowledge the strongest counter-argument, then explain clearly why the recommendation is still the better choice." }
      ]
    },

    audience: {
      label: "Audience",
      guide: [
        "Who exactly will read this? Role, seniority, background.",
        "What do they already know, and what do they care about most?",
        "What might they object to or misunderstand?"
      ],
      presets: [
        { name: "Beginners", text: "The audience is [students / new joiners] with no prior background in [topic]. They are smart but unfamiliar with the vocabulary, so define every term and use relatable examples." },
        { name: "Practitioners", text: "The audience is [engineers / analysts / auditors] who do this work daily. Skip basics, use correct technical terms, and focus on practical detail and edge cases." },
        { name: "Decision makers", text: "The audience is [CXOs / managers / clients] who need to make a decision about [topic]. They care about cost, risk, time and reputation more than technical detail." },
        { name: "Mixed audience", text: "The audience is mixed: [group A] and [group B]. Write the main text for [group A] and add short 'for specialists' notes where [group B] needs more depth." }
      ]
    },

    style: {
      label: "Style",
      guide: [
        "Is there a writing style or example you want copied?",
        "Short and punchy, or detailed and thorough?",
        "Should it use stories, analogies, data, or quotes?"
      ],
      presets: [
        { name: "Plain English", text: "Write in plain English: short sentences, active voice, everyday words, one idea per paragraph." },
        { name: "Storytelling", text: "Use a storytelling style: open with a short, realistic scenario, build tension around the problem, then reveal the solution and the lesson." },
        { name: "Analytical", text: "Use an analytical style: state the claim, show the evidence or reasoning, then the conclusion. Use numbers where they exist." },
        { name: "Match my example", text: "Match the style of this example as closely as possible (sentence length, vocabulary, structure):\n\n[paste an example of the style you want]" }
      ]
    },

    examples: {
      label: "Examples (few-shot)",
      guide: [
        "Can you show 2–3 examples of the exact input → output you want?",
        "Do the examples cover different cases, including a tricky one?",
        "Are the examples consistent with your format and constraints?"
      ],
      presets: [
        { name: "Input → Output pairs", text:
          "Here are examples of what I want. Follow the same pattern for the new input.\n\nExample 1\nInput: [example input 1]\nOutput: [ideal output 1]\n\nExample 2\nInput: [example input 2]\nOutput: [ideal output 2]\n\nExample 3 (tricky case)\nInput: [edge-case input]\nOutput: [ideal output for the edge case]" },
        { name: "Good vs bad example", text:
          "Good example (do this):\n[paste a good example]\nWhy it is good: [reason]\n\nBad example (avoid this):\n[paste a bad example]\nWhy it is bad: [reason]" }
      ]
    },

    reasoning: {
      label: "Reasoning approach",
      guide: [
        "Should the model think step by step, or answer immediately?",
        "Should it list assumptions, consider alternatives, or check its own work?",
        "Do you want to see the reasoning, or only the final answer?"
      ],
      presets: [
        { name: "Step by step", text: "Work through the problem step by step. Show your reasoning briefly for each step, then give the final answer clearly labelled 'Final answer'." },
        { name: "Assumptions first", text: "Before answering, list the assumptions you are making. Then answer. At the end, say which assumption, if wrong, would change your answer the most." },
        { name: "Consider alternatives", text: "Generate at least [three] different approaches, briefly evaluate each against [criteria], then choose the best one and explain why the others lost." },
        { name: "Self-check", text: "After drafting your answer, review it against my objective and constraints. Fix any errors or gaps, then give me only the improved version plus a one-line note of what you changed." },
        { name: "Socratic", text: "Do not give me the answer directly. Guide me with one question at a time so I reach the answer myself. Give a hint only if I am stuck after two attempts." }
      ]
    },

    steps: {
      label: "Steps",
      guide: [
        "What sequence should the model follow?",
        "Are there checkpoints where it should stop and confirm with you?"
      ],
      presets: [
        { name: "Sequential steps", text: "Follow these steps in order:\n1. [first step]\n2. [second step]\n3. [third step]\n4. Review the result against the end goal before responding." },
        { name: "Research → draft → refine", text: "1. Identify what information is needed and note any gaps.\n2. Draft a first version.\n3. Critique the draft against the end goal and constraints.\n4. Produce the improved final version." }
      ]
    },

    endgoal: {
      label: "End goal",
      guide: [
        "What will be different in the real world once you have this output?",
        "How will you measure success?"
      ],
      presets: [
        { name: "Outcome", text: "The end goal is that [who] can [do what] by [when], measured by [success measure]." },
        { name: "Decision", text: "The end goal is a clear, defensible decision on [topic] that I can present to [stakeholder] with confidence." }
      ]
    },

    experiment: {
      label: "Experiment / variations",
      guide: [
        "Do you want several options to compare?",
        "How should the variations differ from each other?"
      ],
      presets: [
        { name: "N variations", text: "Give me [3] distinct variations. Make them differ in [tone / length / angle / structure], label each one, and say which situation each variation suits best." },
        { name: "A/B test pair", text: "Give me two versions designed for an A/B test that differ in only one variable: [variable]. Explain what result would tell me which one is better." }
      ]
    },

    critique: {
      label: "Critique & refine",
      guide: [
        "What criteria should the model use to judge its own first draft?",
        "How many rounds of refinement?"
      ],
      presets: [
        { name: "Draft → critique → final", text: "First write a draft. Then critique it honestly against these criteria: [criterion 1], [criterion 2], [criterion 3], scoring each from 1–5. Finally, rewrite it to fix every weakness you found. Show the scores and the final version." },
        { name: "Red team", text: "After answering, switch roles and act as a sceptical [reviewer / attacker / auditor]. List the three strongest objections or ways this could fail, then revise the answer to address them." }
      ]
    }
  };

  /* ------------------------------------------------------------------
   * FRAMEWORKS — which sections appear, in what order, under what heading.
   * ------------------------------------------------------------------ */
  const FRAMEWORKS = [
    {
      id: "ropcf", name: "Persona → Objective → Problem → Constraints → Format",
      about: "The all-round structure: who the model is, what it must do, the situation, the rules, and what the answer should look like. Start here if you are unsure.",
      sections: [
        { key: "persona" }, { key: "objective" }, { key: "problem" },
        { key: "constraints" }, { key: "format" },
        { key: "tone", optional: true }, { key: "reasoning", optional: true }, { key: "examples", optional: true }
      ]
    },
    {
      id: "costar", name: "CO-STAR (Context, Objective, Style, Tone, Audience, Response)",
      about: "Popular for writing and communication tasks where style, tone and audience matter as much as content.",
      sections: [
        { key: "problem", label: "Context" }, { key: "objective" }, { key: "style" },
        { key: "tone" }, { key: "audience" }, { key: "format", label: "Response format" }
      ]
    },
    {
      id: "risen", name: "RISEN (Role, Instructions, Steps, End goal, Narrowing)",
      about: "Good for multi-step tasks where the order of work and the final outcome must be explicit.",
      sections: [
        { key: "persona", label: "Role" }, { key: "objective", label: "Instructions" },
        { key: "steps" }, { key: "endgoal" }, { key: "constraints", label: "Narrowing (constraints)" }
      ]
    },
    {
      id: "rtf", name: "RTF (Role, Task, Format)",
      about: "The minimal structure for quick, well-defined tasks.",
      sections: [ { key: "persona", label: "Role" }, { key: "objective", label: "Task" }, { key: "format" } ]
    },
    {
      id: "crispe", name: "CRISPE (Capacity, Insight, Statement, Personality, Experiment)",
      about: "Useful for creative work where you want several options to compare.",
      sections: [
        { key: "persona", label: "Capacity & Role" }, { key: "problem", label: "Insight (background)" },
        { key: "objective", label: "Statement (the task)" }, { key: "tone", label: "Personality" },
        { key: "experiment" }
      ]
    },
    {
      id: "cot", name: "Chain-of-thought",
      about: "Asks the model to reason step by step. Best for analysis, maths, troubleshooting and decisions.",
      sections: [
        { key: "persona" }, { key: "problem" }, { key: "objective" },
        { key: "reasoning", preset: 0 }, { key: "format" }
      ]
    },
    {
      id: "fewshot", name: "Few-shot (learn from examples)",
      about: "Shows the model examples of the exact input → output you want, then gives it the real input.",
      sections: [
        { key: "persona" }, { key: "objective" }, { key: "examples" },
        { key: "problem", label: "Now the real input" }, { key: "format" }
      ]
    },
    {
      id: "critique", name: "Critique & refine",
      about: "The model drafts, judges its own work against your criteria, and improves it.",
      sections: [
        { key: "persona" }, { key: "problem" }, { key: "objective" },
        { key: "critique" }, { key: "format" }
      ]
    },
    {
      id: "socratic", name: "Socratic tutor",
      about: "Turns the model into a tutor that guides you with questions instead of giving answers.",
      sections: [
        { key: "persona", preset: 7 }, { key: "objective", preset: 8 }, { key: "problem", preset: 4 },
        { key: "reasoning", preset: 4 }, { key: "constraints" }
      ]
    }
  ];

  /* A fully worked example (security code review) per section, for "Fill worked example". */
  const WORKED_EXAMPLE = {
    persona: "Act as a Senior Application Security Engineer with 12 years of experience securing payment APIs for banks and FinTech companies. You map every finding to OWASP Top 10 and CWE, prioritise by real business risk, and always give a fix a developer can apply today.",
    objective: "Your objective is to review the login endpoint below for security vulnerabilities and tell me which ones to fix first before our release on Friday.",
    problem: "Environment: Node.js 20, Express 4, PostgreSQL 15, deployed behind an AWS ALB.\nWhat the code should do: authenticate a user with email and password and return a session token.\nWhat I already checked: npm audit is clean.\n\nRelevant code:\n```js\napp.post('/login', async (req, res) => {\n  const q = `SELECT * FROM users WHERE email = '${req.body.email}'`;\n  const user = (await db.query(q)).rows[0];\n  if (user && user.password === req.body.password) {\n    res.json({ token: Math.random().toString(36) });\n  } else {\n    res.status(401).send('Invalid email ' + req.body.email);\n  }\n});\n```",
    constraints: "Only state facts you are confident about and do not invent CWE numbers. Keep the answer under 400 words. Do not rewrite the whole application; fix only this endpoint. Recommendations must be compatible with PCI DSS v4.0.",
    format: "Present findings as a Markdown table with the columns: Severity | Issue | OWASP / CWE | Fix. Then give the corrected code in one fenced code block.",
    tone: "Use a professional, direct tone suitable for a developer under time pressure.",
    audience: "The audience is a mid-level backend developer who knows Express well but has little security training.",
    style: "Write in plain English: short sentences, active voice, one idea per paragraph.",
    reasoning: "Work through the code line by line. Show your reasoning briefly for each issue, then give the prioritised list.",
    examples: "Example finding:\nInput: res.send(req.query.name)\nOutput: High | Reflected XSS | A03 Injection / CWE-79 | Encode output or use a templating engine with auto-escaping.",
    steps: "1. Identify every input and where it flows.\n2. List vulnerabilities per line.\n3. Rank by exploitability and impact.\n4. Write the fixed code and re-check it.",
    endgoal: "The end goal is that the developer can ship a login endpoint on Friday with no known High or Critical issues.",
    experiment: "Give me 2 variations of the fixed code: one minimal patch, one using a well-known auth library. Say which suits a Friday deadline.",
    critique: "After drafting, critique your review for missed issues (rate limiting, logging, timing attacks) and add anything you missed."
  };

  window.PROMPT_DATA = { SECTIONS, FRAMEWORKS, WORKED_EXAMPLE };
})();
