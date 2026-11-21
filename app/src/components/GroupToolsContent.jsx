const USE_CASES = [
  {
    title: 'Prepare for an exam together',
    image: 'tasks',
    text: 'Choose a chapter or a set of practice questions as a shared task. Each member joins and marks their own part complete. Set a group goal in minutes to follow the room’s confirmed study time during revision.'
  },
  {
    title: 'Keep a reading appointment',
    image: 'series',
    text: 'Agree on a section to read and a regular time to meet. Preview the next three dates in the group’s time zone, then reserve a place in each activity. Members can bring their own private task to the session.'
  },
  {
    title: 'Make a quiet study routine',
    image: 'study',
    text: 'Meet regularly while working on different subjects. Use the room’s suggested scene or music to settle in, start your own timer when ready, and pause whenever you step away.'
  }
];

const QUESTIONS = [
  ['Who can create shared tasks and recurring activities?',
    'The owner or an eligible co-host can organise shared work when the room has advanced access and they have an active place. Members can join tasks and mark their own part complete.'],
  ['Why are these tools read only?',
    'Check the access message beside the tool. The room may need advanced access, your place may be read only, or the room may be closed. The owner can enable the optional free preview when it is available.'],
  ['Does everyone need to enable a preview?',
    'Shared tools follow the room owner’s access. Members participate through the room’s access. The optional free preview applies to rooms the owner owns on that account and creates no payment or subscription.'],
  ['What happens when access ends?',
    'Available saved content becomes read only and recurring activities pause. Personal scene and music controls, free timers, single study activities and basic group progress remain available within the room allowance.'],
  ['Can members see my personal plans and reflections?',
    'Shared task titles and participation are visible to room members. Personal study plans and private activity reflections stay separate. Each person controls the scene and music they use on their own device.']
];

export function GroupToolsContent({publicGuide = false}) {
  const prefix = publicGuide ? 'public-tools' : 'room-tools';
  return <div className="tools-editorial">
    <section className="tools-explainer" aria-labelledby={prefix + '-intro'}>
      <div className="tools-editorial-heading">
        <h3 id={prefix + '-intro'}>Online study tools for your group</h3>
        <p>Agree what to work on, make time to meet, and follow the effort your group records together.
          These tools support a small group routine while each person keeps control of their own study session.</p>
      </div>
      <dl className="tools-purpose-list">
        <div><dt>Shared tasks</dt><dd>Put a specific piece of work in front of the group. Members join the task and record their own completion.</dd></div>
        <div><dt>Recurring activities</dt><dd>Set weekdays, a local time and a time zone for a regular appointment. Check upcoming dates before saving.</dd></div>
        <div><dt>Group goal</dt><dd>Choose a target and an end date. Follow confirmed room minutes or activities with attendance. Organisers can update the target and deadline while keeping recorded progress.</dd></div>
        <div><dt>Room atmosphere</dt><dd>Choose a background, music and volume directly. Personal playback works with an active room place. Organisers with advanced access can save a suggestion for the room.</dd></div>
      </dl>
    </section>

    <section className="tools-use-cases" aria-labelledby={prefix + '-scenarios'}>
      <div className="tools-editorial-heading">
        <h3 id={prefix + '-scenarios'}>Three ways to study together</h3>
        <p>Start with the kind of work your group already wants to do.</p>
      </div>
      <div className="tools-scenario-list">
        {USE_CASES.map(item => <article key={item.title}>
          <img src={'/images/group-tools/' + item.image + '-art.jpg'} alt="" width="320" height="240" loading="lazy"/>
          <div><h4>{item.title}</h4><p>{item.text}</p></div>
        </article>)}
      </div>
    </section>

    <section className="tools-routine" aria-labelledby={prefix + '-routine'}>
      <div className="tools-editorial-heading">
        <h3 id={prefix + '-routine'}>From a shared task to a regular study routine</h3>
        <p>An illustrative revision session, from the first plan to the next meeting.</p>
      </div>
      <ol className="tools-routine-flow">
        <li><strong>Choose a small task</strong><p>Add a reading or practice task that each member can finish in one session.</p></li>
        <li><strong>Agree a time</strong><p>Plan a single activity, or set a recurring appointment with eligible advanced access.</p></li>
        <li><strong>Study at your own pace</strong><p>Reserve a place and start your own room timer. Pause when you step away.</p></li>
        <li><strong>Record and review</strong><p>Mark your part complete. Check confirmed group time and decide what to work on next.</p></li>
      </ol>
    </section>

    <section className="tools-records" aria-labelledby={prefix + '-records'}>
      <div className="tools-editorial-heading">
        <h3 id={prefix + '-records'}>What counts towards your group’s progress?</h3>
        <p>Task status, bookings and recorded study describe different parts of your session.</p>
      </div>
      <table className="tools-records-table">
        <thead><tr><th scope="col">What you do</th><th scope="col">What the room records</th></tr></thead>
        <tbody>
          <tr><th scope="row">Join a shared task</th><td>Your participation in that task</td></tr>
          <tr><th scope="row">Mark your part done</th><td>Your completion status for that task</td></tr>
          <tr><th scope="row">Reserve an activity</th><td>Your place in that particular session</td></tr>
          <tr><th scope="row">Study with your room timer and check in</th><td>Confirmed study time under the room’s recording rules</td></tr>
        </tbody>
      </table>
      <p className="tools-records-note">A minutes goal uses confirmed room time. An attendance goal uses activities with attendance.
        Task completion, online presence and reservations do not add study minutes.</p>
    </section>

    <section className="tools-questions" aria-labelledby={prefix + '-questions'}>
      <div className="tools-editorial-heading"><h3 id={prefix + '-questions'}>Access, privacy and common questions</h3></div>
      <dl>{QUESTIONS.map(([question, answer]) => <div key={question}><dt>{question}</dt><dd>{answer}</dd></div>)}</dl>
    </section>

    <nav className="tools-reading-links" aria-label="Related learning guides">
      <a href="/study-groups#group-how">Study room guide →</a>
      <a href="/study-planner">Plan your own study tasks →</a>
      <a href="/study-groups#group-weekly-reports">Understand weekly reports →</a>
    </nav>
  </div>;
}
