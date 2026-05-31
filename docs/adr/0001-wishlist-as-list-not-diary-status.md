# Wishlist is a List, not a DiaryEntry status

The PRD originally included `wishlist` as a valid `DiaryEntry.status` value alongside `in-progress`, `paused`, `abandoned`, and `finished`. We removed it.

Wanting to consume something is expressed exclusively as a **ListItem** in the user's default **Wishlist** list. A **DiaryEntry** is only created when a user begins active consumption (sets status to `in-progress` or higher). This keeps the two models cleanly separate: lists track curation and intent; diary entries track consumption state.

The alternative — keeping `wishlist` as a diary status — would require "Add to Wishlist" to write to both a ListItem and a DiaryEntry, with no clear authority when they disagree. The models would need to stay in sync indefinitely, and the diary would conflate "I want to watch this someday" with "I am watching this."
