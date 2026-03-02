# GoDoIt

A task management app I built to solve something that genuinely annoyed me: every to-do app I tried felt either too minimal to be useful, or so feature-heavy it became its own distraction. I wanted something that felt good to open, had real depth underneath a calm surface, and actually helped me stay focused rather than just organized.

So I built it over two days.

**Live:** https://godoit-fawn.vercel.app

-----

## What it does

The core is a full task management system: projects, priorities, subtasks, due dates, recurring tasks, and drag-to-reorder. But the two things that make it different are the ambient music player and the Pomodoro timer built into the sidebar. You set a focus session, pick a background sound, and the whole app becomes a workspace rather than just a list.

A few things I’m particularly happy with:

- The **warm dark mode** uses a walnut-toned palette instead of generic grays. Small detail, but it matters when you’re staring at something for hours.
- The **stats dashboard** tracks your completion streak, shows a 30-day activity heatmap, and breaks down pending tasks by priority and project. I built it because I wanted to see patterns in how I actually work, not just what I finished today.
- On mobile, the task detail panel slides up from the bottom (like a native sheet) instead of from the side, which feels a lot more natural on a phone.
- The Pomodoro bell uses the Web Audio API to synthesize a sine wave with a frequency ramp. No audio file to host, no network request, just math.

-----

## Stack

|Layer        |What I used                           |
|-------------|--------------------------------------|
|Frontend     |React 18 + Vite                       |
|Styling      |CSS Modules with CSS custom properties|
|Animations   |Framer Motion                         |
|Drag and drop|@dnd-kit/core                         |
|Database     |Supabase (Postgres with RLS)          |
|Auth         |Supabase Auth (email + magic link)    |
|Audio        |Web Audio API + HTML Audio element    |
|Deployment   |Vercel                                |
|Fonts        |Lora, Nunito, JetBrains Mono          |

-----

## Architecture decisions worth explaining

**CSS custom properties for theming instead of a library**

Both the light and dark themes live entirely in CSS under `[data-theme]` attribute selectors. React toggles a single attribute on `<html>` and the rest happens in the stylesheet. There’s no JS-in-CSS, no runtime style injection, no Styled Components overhead. The theme switch is instant because it’s just CSS variable reassignment.

**@dnd-kit over react-beautiful-dnd**

react-beautiful-dnd is effectively deprecated at this point, and it has known issues with React strict mode that require workarounds. @dnd-kit is actively maintained, significantly lighter, and has first-class pointer and touch sensor support out of the box. The reorder writes back to Supabase in parallel without blocking the UI, so the list feels instant even on slower connections.

**Optimistic UI for task completion**

When you check off a task, the UI updates immediately and the database write happens in the background. There’s no loading spinner on the checkbox, no waiting for a round trip. If the write fails, it rolls back. This is the right pattern for anything a user does repeatedly, and task completion is the most repeated action in the app.

**Visualizer without AnalyserNode**

The ambient audio streams from a CDN with CORS restrictions, which means I can’t attach a Web Audio AnalyserNode to read frequency data. Instead, the visualizer uses a randomized interval that produces bar heights weighted toward the middle of the range. It looks like it’s responding to the music because the timing and distribution feel right, even though it’s not actually connected to the audio signal. Sometimes the right answer is the one that works.

**Supabase RLS everywhere**

Every table has row-level security enabled. Users can only read and write their own data, enforced at the database level regardless of what the frontend does. The anon key is safe to expose in the browser because it literally cannot bypass these policies.

-----

## Project structure

```
src/
├── components/
│   ├── Auth/           Sign in modal with email and magic link tabs
│   ├── BottomNav/      Mobile navigation bar
│   ├── FocusMode/      Overlay that combines timer and music
│   ├── MusicPlayer/    Ambient player with animated visualizer
│   ├── Pomodoro/       SVG ring timer with phase transitions
│   ├── Sidebar/        Navigation, projects, timer, and music
│   ├── Stats/          Progress panel with heatmap and breakdowns
│   ├── TaskCard/       Card component and sortable DnD wrapper
│   ├── TaskDetail/     Slide-in edit panel with full task fields
│   └── TaskList/       Main view with grouping and infinite list
├── hooks/
│   ├── useAmbientMusic.js    Playback state and visualizer animation
│   ├── usePomodoro.js        Timer phases and Web Audio bell synthesis
│   ├── useSortableTasks.js   DnD reorder with database sync
│   └── useTheme.js           Theme toggle with localStorage persistence
└── services/
    ├── authService.js         Supabase Auth wrapper
    ├── notificationService.js Browser notification scheduling
    ├── statsService.js        Streak calculation and heatmap aggregation
    └── taskService.js         Full CRUD for tasks, subtasks, and projects
```

-----

## Database schema

```sql
profiles     -- auto-created on signup via trigger
projects     -- color, icon, position ordering
tasks        -- priority, status, due_date, recur_rule (jsonb), position
subtasks     -- linked to parent task, independent completion
```

Every table has RLS. Tasks and subtasks use `position` integers for drag ordering, updated in parallel after each drop.

Recurring task rules are stored as JSONB in the format `{ freq, interval, days }` which keeps the schema simple while supporting daily, weekly with day-of-week selection, and monthly patterns.

-----

## Running locally

```bash
git clone https://github.com/Aisha-Aliyu/godoit.git
cd godoit
npm install
```

Create `.env`:

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Run the SQL schema in your Supabase project (see `docs/schema.sql`), then:

```bash
npm run dev
```

-----

## Security

- RLS on every table, policies verified manually via direct API testing
- Supabase Auth handles session management, token rotation, and storage
- Content Security Policy, HSTS, X-Frame-Options, and nosniff headers set at the Vercel edge
- `media-src` in the CSP explicitly allowlists the audio CDN domain
- No user input is ever passed to raw SQL

-----

## What I would add next

There are a few things I cut for scope that I actually want to build:

A **calendar view** that shows task density across a month grid. The heatmap in the stats panel is useful for looking backward, but I want something forward-looking too.

**Natural language task input** along the lines of “submit report by Friday, high priority” parsing into the right fields automatically. The structure is already there, it just needs an NLP layer in front of the form.

**Offline task creation** using Workbox BackgroundSync. Right now the service worker caches assets but writes still require a connection. The data model is simple enough that offline queueing would be straightforward.

**Custom ambient tracks** uploaded by the user to Supabase Storage. Some people have very specific sounds they focus to and the six built-in options are just a starting point.

-----

Built by Humairah Aliyu. Part of BLOODLINE Studios.

MIT License