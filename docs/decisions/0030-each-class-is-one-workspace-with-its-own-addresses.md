# 0030. Each class is one workspace with its own addresses

- Status: Accepted
- Date: 2026-11-14

## Context

[Decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) makes each class one workspace, which principle 1 of the approved design states: a reader lands in the workspace of their last class, navigation never leaves it, and a switcher in the top bar changes the class. The app had a page for each feature, and a person who signed in landed on the list of their classes. The screens of the design come in the changes that issue #127 tracks, which run at the same time, and each of them needs to know the address of its own screen and of every screen that it links to. The prototype gives each screen an address in Bahasa Indonesia after a hash, such as `#/beranda` and `#/saham/BBCA/beli`, which a server never sees. A student can belong to several classes, and so can a lecturer, and a link to a page of a class must open that class for whoever follows it. No class has used the app yet, so no bookmark or shared link points at an address that changes.

## Decision

### The addresses

Every screen of a class has an address under the class, in English words, which the browser sends to the server, so each screen works before JavaScript loads and the back button returns to it.

| Screen                                                                                      | Address                                                                |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Beranda of a student, and Kelas of the lecturer                                             | `/classes/:classId`                                                    |
| Pasar                                                                                       | `/classes/:classId/market`                                             |
| A stock                                                                                     | `/classes/:classId/stocks/:code`                                       |
| The order ticket of a stock, to buy or to sell                                              | `/classes/:classId/stocks/:code/buy`, `.../sell`                       |
| Aktivitas                                                                                   | `/classes/:classId/activity`                                           |
| Analisis                                                                                    | `/classes/:classId/analysis`                                           |
| Belajar                                                                                     | `/classes/:classId/learn`                                              |
| A lesson, by the number of its session, or the guide to reading prices                      | `/classes/:classId/learn/:session`, `/classes/:classId/learn/prices`   |
| Kamus                                                                                       | `/classes/:classId/glossary`                                           |
| Mahasiswa                                                                                   | `/classes/:classId/students`                                           |
| A student as the lecturer reads them: Ringkasan, Analisis, and "Jurnal dan order"           | `/classes/:classId/students/:studentId`, `.../analysis`, `.../journal` |
| The reset of the password of a student                                                      | `/classes/:classId/students/:studentId/password`                       |
| The workbook of the portfolios of the class                                                 | `/classes/:classId/workbook`                                           |
| Portofolio, the demonstration portfolio of the lecturer: Ringkasan, Aktivitas, and Analisis | `/classes/:classId/demonstration`, `.../activity`, `.../analysis`      |
| The calendar of the class, where its lecturer sets the date of session 1                    | `/classes/:classId/calendar`                                           |

- The one address of a class opens the home of each reader in it, so a lecturer and a student who share a link to a class each land where they work.
- A view that a control of a screen chooses keeps its own address in the query of the screen, such as the map of Pasar instead of its list, a filter, a range of a chart, or the student whom Mahasiswa shows in its panel. A link sets it before JavaScript loads, and the back button returns to it.
- A part of a page to which a link leads, such as the practice of a lesson or a term of Kamus, is the fragment of the address of its page.
- A task of a lesson that opens another screen, such as the order ticket, names its lesson in the query of that screen, which shows the task in one line with the way back to the practice of the lesson.
- Outside a class, the addresses stay as they are: signing in and out, the account and its setup, the privacy notice, the list of classes, where a lecturer creates one, joining a class with or without its code, the language, and the check of the health of the server. The guide for the lecturer gets `/guide`. The change that gives the pages outside a class the look of Peta sends a visitor from the home page to signing in and removes the public prices at `/prices`, as issue #127 tracks.
- Each screen takes its address in the change of issue #127 that rebuilds it. An item of the navigation leads to the page that holds it until then, and the address that a page leaves answers as one that does not exist, without a redirect, because no class has used it.

### The navigation

- The items of a student are Beranda, Pasar, Aktivitas, Analisis, and Belajar. The items of a lecturer are Kelas, Mahasiswa, Portofolio, Pasar, and Belajar. Belajar joins both with the change that builds it, and Portofolio with the change that builds the demonstration portfolio, because an item that leads to another screen than its name would mislead.
- A desktop shows the items in the rail, and a phone in the tab bar, each with its icon above its label, as decision 0028 sizes them. The current item is the item of the page, or of the nearest page above it, such as Pasar on a stock, and only on a page of the class of the workspace.
- A visitor who is not signed in has the items of the prices, joining a class, and signing in. A person without a class and a person who has not finished the account have none.

### Landing in a class

- The workspace of a reader is the class of the address when the reader belongs to it. On every other page, it is the class that the reader opened last, and when the reader does not belong to that class, the class that the reader joined or created last.
- The home page sends a person who is signed in to the first item of the workspace, which is the home of the class. A student without a class goes to joining one, and a lecturer without a class to the form that creates one. Signing in without a page to return to leads to the home page, so a person lands in a class after signing in, as after every other way home, such as the app icon in the rail.
- The browser keeps the class that a person opened last in a cookie. A cookie stays when its person signs out, so the next sign-in on the same browser lands in that class. A page that another site made the browser load leaves the cookie as it was.
- The switcher of the class opens a menu of every class of the reader, each with its lecturer or the number of its students and its term, and each leads to the home of its class. The menu ends with joining another class for a student and creating one for a lecturer.
- A class has one name, which its lecturer gives, and no course apart from it, so the switcher shows that name where the references draw the course and the class. A phone shows the name on at most two lines without the term, as the references leave the term out on a phone, and a desktop shows the term beside the name.

### What opens in place and what navigates

What a reader asks for while doing something opens in place, as `AGENTS.md` requires, and closing it returns to the same place: the switcher of the class, the menu of the profile, the card of the badge of the simulation, a "?" card, a calculation, a key term, a lesson or Kamus opened from another screen, the panel of a selected student, and the order ticket of a stock, which docks beside the stock on a desktop and opens as a sheet over it on a phone. A screen that a reader goes to navigates to its address: an item of the navigation, a class in the switcher, a stock from a row, a point, or a code, a student from Kelas, the portfolio or the journal of a student, a lesson from Belajar, and a task of a lesson. The list of [the prototype](https://github.com/radenadam/portolab/blob/83171b2b5ad1f7a8a6af05c2127df0750885035c/links.md) names every such control.

## Alternatives

- **The addresses of the prototype, in Bahasa Indonesia after a hash.** A server never sees a hash, so no screen would work before JavaScript loads, and the addresses would be in another language than the code.
- **A workspace without the class in its addresses, such as `/market` for the class that the reader opened last.** A link to a page of a class would open another class for a reader whose last class differs, and two tabs could not show two classes.
- **An address of its own for Kelas and for Beranda.** A link to a class would then open a page that one of the two roles cannot see.
- **The class that a person opened last in the database.** It would need a column and a migration, and a person who uses two devices for two classes would land in the class of the other device.
- **Redirects from the addresses that pages leave.** No class has used them, so a redirect would keep code for links that nobody has.

## Consequences

- `app/routes.ts` and `app/features/navigation/frame-navigation.ts` change with each change of issue #127 that moves a screen to its address.
- The rule of [decision 0025](0025-the-student-chooses-the-stock-of-an-order-before-the-order-form.md) that the address of the orders names the stock of an order holds until the change that builds the order ticket moves it to the address of its stock.
- The privacy notice states the cookie of the class with its lifetime.
