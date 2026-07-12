# Teaching Plugin

Course management with topics, interest tagging, subscription-based access, and teaser content for the Qbix platform. Teaching builds on Streams, Communities, and Assets to provide a learning management system where teachers create courses with structured topics, students subscribe via payment plans, and non-subscribers see teaser content until they pay.

## Core Concepts

### Courses

A `Teaching/course` stream represents a course with a title, description (content), cover image (icon), related interests, and structured topics. Courses are related to the community's `Teaching/courses/main` category stream via `Teaching/course` relation type, which serves as the course directory. The courses listing is rendered with `Streams/related` tool, with a composer for creating new courses.

Default access levels on courses are `readLevel: 20, writeLevel: 20, adminLevel: 20` — meaning participants with relate-level read access can see the course exists but not its full content. Full content (readLevel 40) is gated behind subscription. The `Users/teachers` label gets full access (read 40, write 30, admin 30) to the `Teaching/courses/main` category and to all `Teaching/course*` streams via wildcard access rows created at install time.

### Teaser Content

Courses support a dual-content model for paywall gating. When a user lacks full read access (`readLevel < 40`), the UI shows teaser content from stream attributes instead of the real content: `teaser:Streams/description` provides a preview description, and `teaser:Streams/video` provides a preview video URL. Once the user subscribes and gains full access, the actual stream content and topics become visible.

### Topics

Topics within a course use the core `Streams/topic` relation type and `Streams/topic` tool. Topics are related to the course stream and rendered via `Streams/related` with a "New Topic" composer. Each topic opens in its own column view with the course's cover image as background. Topics provide the structural hierarchy within a course — think chapters, lessons, or modules.

### Interests

Courses can be tagged with interests via the `interest` relation type. The PUT handler supports `addInterests` (relates `Streams/interest` streams to the course) and `removeInterests` (unrelates them). Interests are displayed on the course detail view and can be used for discovery.

### Subscription & Payment

Courses integrate with Assets for subscription-based access. The POST handler's `subscription` slot creates an `Assets/plan` stream with `interrupted: true` (meaning access is cut when the subscription lapses) and relates the course to it via `Assets_Subscription::$relationType`. Teachers can also assign existing community plans to courses. The `Assets.canPayForStreams.types` config includes `Teaching/course`, enabling the pay-for-stream flow.

When a student subscribes to a plan that includes a course, their access level is elevated to full read, unlocking the real content and topics. When the subscription is interrupted (lapses), access reverts to the teaser level.

### Course Composer

`Teaching_Course::getComposerStream()` implements the draft-course pattern. When creating a new course, it first looks for an existing draft — a course already related to the category with relation type `"new"` that the current user has write access to. If found, it returns that draft for continued editing. If not, it creates a new `Teaching/course` stream and relates it to the category as `"new"`. When the course is published, the relation type changes from `"new"` to `"Teaching/course"`.

If the publisher differs from the logged-in user (e.g. a teacher publishing under the community), an explicit `Streams_Access` row is created granting the teacher full access.

### Conversation

Each course has a built-in chat conversation accessible from the course detail view, using the core `Streams/chat` tool with the course stream as the chat context.

## Roles

`Users/authors` — Can grant/revoke teachers and students. `Users/teachers` — Can create courses, manage topics, assign plans, grant/revoke members/guests/students. Get full access to the courses category and all course streams. `Users/students` — Can grant/revoke guests. Enrolled in courses. `Users/alumni` — Former students. Can grant/revoke guests.

All roles are auto-created on community insert (`Users.onInsert.roles`).

## Stream Types

| Type | Purpose |
|---|---|
| `Teaching/course` | Course with content, teaser, topics, and interests |

Courses also use core stream types: `Streams/topic` for course sections, `Streams/interest` for tagging, `Assets/plan` for subscriptions.

## User Streams

| Stream Name | Purpose |
|---|---|
| `Teaching/courses/main` | Community course directory (Streams/category) |

## Database

No custom tables. All data lives in Streams infrastructure — stream fields (title, content, icon), stream attributes (teaser:Streams/description, teaser:Streams/video), relations (Teaching/course, interest, Streams/topic, new, Assets subscription), and access rows.

## Configuration

```json
{
    "Streams": {
        "types": {
            "*": { "canCreate": ["Users/teachers"] },
            "Teaching/course": {
                "defaults": { "readLevel": 20, "writeLevel": 20, "adminLevel": 20 }
            }
        }
    },
    "Assets": {
        "canPayForStreams": { "types": ["Teaching/course"] }
    }
}
```

## Routes

`courses` → course directory listing. `course/{publisherId}/{courseId}` → course detail with topics. The UI uses Qbix's column navigation: courses list → course detail → topic.