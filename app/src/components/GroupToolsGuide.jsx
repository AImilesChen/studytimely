import './group-tools-hub.css';

export const GROUP_TOOL_CARDS = [
  {
    id: 'tasks', emoji: '📚', title: 'Shared tasks',
    description: 'Choose a task to work on together. Personal plans stay private.',
    example: 'Add a reading task and track each person’s part',
    alt: 'Shared task board showing Add shared task and a completed reading task',
    steps: [
      'Pick a subject and a ready-made task in the task fields. You can enter your own title when custom titles are available.',
      'Select Save shared task. The task appears on the board for members to join.',
      'Choose Join task, then My part is done when finished. The board updates participation and completion.'
    ],
    note: 'Task completion does not add study minutes.'
  },
  {
    id: 'series', emoji: '🐧', title: 'Recurring activities',
    description: 'Arrange a regular session in the group’s time zone.',
    example: 'Set a weekly time and check the upcoming dates',
    alt: 'Recurring activity with weekdays, time zone, and controls to edit or pause future dates',
    steps: [
      'Choose Repeat an activity. Set weekdays, local start time, time zone, study length and break length.',
      'Select Preview dates to check the next three occurrences. Save to add the series.',
      'Members open an upcoming activity to reserve a place in Study activities. Organisers can edit or pause future dates.'
    ],
    note: 'Editing replaces future scheduled occurrences and members need to confirm again. Running and completed sessions keep their records.'
  },
  {
    id: 'challenge', emoji: '🏁', title: 'Group goal', navLabel: 'Group goal',
    description: 'Set a target for confirmed study minutes or activities attended.',
    example: 'Set a study target and follow the recorded progress',
    alt: 'Group goal with recorded progress, editable target and end date, and an invitation action',
    steps: [
      'Use the settings beside the progress to choose what to count, a target and the end date. Select Create group goal.',
      'Study in this room. Confirmed minutes or activities with attendance add to the goal. Invite members to this goal copies the room invitation.',
      'Organisers can edit the target and end date directly, then choose Save goal changes. End current goal is a separate action.'
    ],
    note: 'Reservations, online presence and task completion do not add minutes. Reaching the target does not stop a timer.'
  },
  {
    id: 'study', emoji: '🎧', title: 'Room atmosphere', navLabel: 'Atmosphere',
    description: 'Choose a background and music, then use them on your device.',
    example: 'Apply a scene and choose whether to play music',
    alt: 'Room scene recommendation with separate Use scene, Play music and volume controls',
    steps: [
      'Choose a Background in the visible selector. Check the preview, then select Use scene to apply it on this device.',
      'Choose a Music track, then select Play music when you want sound. Pause music and Volume stay beside the player.',
      'Organisers can select Save as room recommendation to suggest this combination to members. Personal playback works without advanced access.'
    ],
    note: 'Applying a scene does not start audio.'
  }
];

const LESSONS = {
  tasks: {
    title: 'Your first shared study task',
    example: 'Read a chapter together, then each person records their own part.',
    labels: ['Choose the task', 'Save it for the group', 'Join and finish your part']
  },
  series: {
    title: 'Make a regular time to study',
    example: 'Meet on Wednesday evenings for a 25-minute revision session.',
    labels: ['Pick weekdays and a time', 'Check the next three dates', 'Reserve your place']
  },
  challenge: {
    title: 'Turn small sessions into a shared goal',
    example: 'Four friends work towards 600 confirmed study minutes together.',
    labels: ['Set a target and end date', 'Study and invite your partners', 'Adjust the goal or end it']
  },
  study: {
    title: 'Settle into your study space',
    example: 'Use a quiet library scene and play music at your own volume.',
    labels: ['Apply the scene', 'Choose whether to play', 'Adjust your own volume']
  }
};

export function ToolLesson({tool, titleAs: Title = 'h4'}) {
  const lesson = LESSONS[tool.id];
  return <section className="tools-lesson" aria-label={'How to use ' + tool.title.toLowerCase()}>
    <div className="tools-lesson-heading">
      <Title>{lesson.title}</Title>
      <span>Illustrative example</span>
    </div>
    <div className="tools-lesson-body">
      <img src={'/images/group-tools/' + tool.id + '-art.jpg'} alt="" width="320" height="240" loading="lazy"/>
      <div>
        <p>{lesson.example}</p>
        <ol>{lesson.labels.map((label, index) => <li key={label}>
          <strong>{label}</strong><span>{tool.steps[index]}</span>
        </li>)}</ol>
      </div>
    </div>
    <p className="tools-lesson-note">{tool.note}</p>
  </section>;
}

export function GroupToolsGuide({publicGuide = false, activeTool = 'tasks'}) {
  const examples = publicGuide ? GROUP_TOOL_CARDS : GROUP_TOOL_CARDS.filter(tool => tool.id === activeTool);
  return <section className="group-tools-guide" aria-label="How to use group tools">
    <h3>{publicGuide ? 'How to use group tools' : 'How to use ' + examples[0].title.toLowerCase()}</h3>
    {examples.map(tool => <ToolLesson key={tool.id} tool={tool}/>)}
  </section>;
}
