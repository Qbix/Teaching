# Teaching Plugin — LLM Coding Primer

Supplement to Q Framework, Streams, and Assets primers. Covers course creation,
topics, interest tagging, subscription-gated access, and teaser content.

---

## 1. Creating Courses

```php
// Get or create a draft course for the composer
$stream = Teaching_Course::getComposerStream(
    $publisherId,    // null = logged-in user
    array(           // category stream (usually Teaching/courses/main)
        'publisherId' => $communityId,
        'streamName'  => 'Teaching/courses/main'
    )
);
// Looks for existing "new" draft the user can write to
// If none found, creates a new Teaching/course stream
// Relates to category with type="new" (draft)
// If publisherId != loggedInUser, grants explicit full access

// The Streams/related tool handles the composer UI:
// Q::tool("Streams/related", array(
//     "publisherId" => $communityId,
//     "streamName"  => "Teaching/courses/main",
//     "relationType" => "Teaching/course",
//     "creatable" => array("Teaching/course" => array("title" => "New course"))
// ))

// Course stream fields:
// title    — course name
// content  — full description (visible only with readLevel >= 40)
// icon     — cover image (sizes: 80, 1000x)
// attributes:
//   teaser:Streams/description — preview text for non-subscribers
//   teaser:Streams/video       — preview video URL for non-subscribers
```

---

## 2. Topics

```php
// Topics use core Streams/topic type, related to the course
// Created via Streams/related tool with Streams/topic relation type

// The course tool renders topics:
// Q::tool("Streams/related", array(
//     "publisherId" => $stream->publisherId,
//     "streamName"  => $stream->name,
//     "relationType" => "Streams/topic",
//     "creatable" => array("Streams/topic" => array("title" => "New Topic"))
// ))

// Topics appear in the course detail column
// Each topic opens its own column via Streams/topic tool
// Course cover image is inherited as topic background
```

---

## 3. Interest Tagging

```php
// Add interests to a course (PUT handler, addInterests slot)
// Interests use core Streams/interest streams

// Server-side: relate interest streams to course
$interest = Streams::getInterest($interestTitle);
$course->relateFrom($interest, "interest");

// Remove interests (PUT handler, removeInterests slot)
Streams::unrelate(
    null,
    $course->publisherId,
    $course->name,
    "interest",
    Users::currentCommunityId(true),
    "Streams/interest/" . $interestKey
);

// Interests are fetched on the client:
// Q.Streams.related.force(publisherId, streamName, "interest", true, ...)
// Displayed as a list in the course detail view
```

---

## 4. Subscription & Payment

```php
// Create an interrupted subscription plan for a course (POST handler, subscription slot)
$plan = Streams::create($publisherId, $publisherId, "Assets/plan", array(
    "title" => $course->title,
    "attributes" => array(
        "amount"      => 0,        // set actual price
        "currency"    => "USD",
        "period"      => "monthly",
        "interrupted" => true      // access revoked when subscription lapses
    )
), array(
    "skipAccess" => true,
    'relate' => array(
        "publisherId" => Users::communityId(),
        "streamName"  => "Assets/plans",
        "type"        => "Assets/plan"
    )
));
// Relate course to the plan
$course->relateTo($plan, Assets_Subscription::$relationType, null, array("skipAccess" => true));

// Access model:
// Default readLevel = 20 → user sees teaser content only
// After subscription → readLevel elevated to 40 → full content visible
// Subscription lapses → readLevel reverts to 20 → back to teaser

// On the client, content is gated:
// var fullAccess = stream.testReadLevel(40);
// var content = fullAccess ? stream.fields.content : stream.getAttribute("teaser:Streams/description");
```

---

## 5. Teacher Join

```php
// Join a teacher to a course (POST handler, join slot)
// Requires writeLevel >= edit on the course
// Checks user has Users/teachers role in the community

$loggedInUserId = Users::loggedInUser(true)->id;
$authorRole = "Users/teachers";
if ((bool)Users::roles(Users::communityId(), array($authorRole), array(), $loggedInUserId)) {
    $course->join(array(
        "extra" => array("role" => $authorRole)
    ));
}
```

---

## 6. Roles

```
Users/authors   — Can grant/revoke teachers and students
Users/teachers  — Can create courses (canCreate on all stream types)
                  Full access to Teaching/courses/main (write 30, admin 30)
                  Full access to Teaching/course* (wildcard, read/write/admin 40)
                  Can grant members, guests, students
Users/students  — Enrolled students, can grant guests
Users/alumni    — Former students, can grant guests

// All auto-created on community insert via Users.onInsert.roles
// Calendars/admins can also manage teachers/students/speakers
```

---

## 7. Common Mistakes

| Wrong | Right |
|-------|-------|
| Creating courses with `Streams::create()` directly | Use `Teaching_Course::getComposerStream()` — handles drafts, access grants, category relations |
| Setting course content in attributes | Course description goes in `stream->content` (field); teaser goes in `teaser:Streams/description` (attribute) |
| Forgetting `interrupted: true` on the Assets/plan | Without `interrupted`, access persists after subscription lapses |
| Checking `readLevel >= 20` for full content | Full content requires `readLevel >= 40`; level 20 only shows teaser |
| Creating topics with a custom type | Topics use core `Streams/topic` type and relation — no custom Teaching type needed |
| Granting course creation to non-teachers | `Streams.types.*.canCreate` restricts stream creation to `Users/teachers` |

---

## 8. Stream & Relation Reference

```
Stream types:
  Teaching/course          — Course (title, content, icon, teaser attributes)

User streams:
  Teaching/courses/main    — Community course directory (Streams/category)

Relation types used:
  Teaching/course          — course → Teaching/courses/main category
  new                      — draft course → category (before publishing)
  interest                 — Streams/interest → course
  Streams/topic            — Streams/topic → course (topics/chapters)
  Assets_Subscription rel  — course → Assets/plan (subscription gating)

Key attributes:
  teaser:Streams/description  — preview text for non-subscribers
  teaser:Streams/video        — preview video URL for non-subscribers
```

---

## 9. Configuration Reference

```
Streams.types.*.canCreate                   — ["Users/teachers"] (who can create streams)
Streams.types.Teaching/course.defaults.*    — readLevel: 20, writeLevel: 20, adminLevel: 20
Assets.canPayForStreams.types               — ["Teaching/course"] (enables pay-for-stream)
```