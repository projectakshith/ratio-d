# ratiod bugs

## today double counting
- description: when checking the app on a class day, if today's date is in the calendar, the recovery date calculator simulates today's classes again even if they already happened and are in the scraped attendance numbers. this double counts hours and makes recovery look faster or earlier than it is.
- fix: check the current clock time against the class end times in the schedule and skip simulating any of today's classes that are already over.

## theory vs practical fallback match
- description: when matching a calendar class to a subject, if the strict match fails, the fallback matches only by course code or name and ignores the class type (theory or practical). this means a theory subject can mistakenly match and count hours from a practical lab class, showing a wrong recovery date.
- fix: make the match helper strictly respect class types even in the fallback.

## prediction card class counts not updating
- description: when predicting leaves or attendance, the ui card only updates the percentage but the class ratio (conducted or present counts) is hardcoded to show the original scraped values. also, `getprocessedlist` doesn't return the simulated counts, so the frontend has no access to them.
- fix: update `getprocessedlist` to return the new present and conducted counts, and wire them up in the ui cards.

## unused predictaction parameter
- description: `getrecoverydate` accepts `predictaction` as a parameter (defaulting to `"leave"`), but the function body never actually uses this parameter. it has hardcoded logic for how to handle simulated actions.
- fix: remove the unused parameter or refactor the code to utilize it if custom future default actions are needed.
