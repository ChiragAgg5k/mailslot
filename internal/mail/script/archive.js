// Gmail archives by removing the Inbox label, which no scripting command of Mail does:
// a move to All Mail or to a label leaves the message in Inbox. Mail's own
// Message > Archive command does it, so this opens the message in its own window and
// clicks that menu item through System Events. That needs Accessibility, an unlocked
// screen and Mail on the current desktop, and the menu names are Mail's English ones.
const archiveSystemEvents = Application('System Events');
const archiveUnavailable =
  "Mail's Archive command is unavailable; unlock the screen, keep Mail on the current desktop and leave the Mac alone while it runs";

function archiveMenuItem() {
  const mail = archiveSystemEvents.processes.byName('Mail');
  mail.frontmost = true;
  return mail.menuBars[0].menuBarItems.byName('Message').menus[0].menuItems.byName('Archive');
}

function main(request) {
  const found = findMessage(request);
  const message = found.message;
  // Gmail keeps an archived message in All Mail, so one found there is confirmed by leaving Inbox.
  const confirmed = preludeLeaf(found.mailbox).toLowerCase() === 'all mail' ? 'Inbox' : found.mailbox;
  const source = locateMailbox({ account: request.account, mailbox: confirmed }).mailbox;
  const captured = describe(message, found.mailbox);
  if (captured.messageId === '') throw refuse('the message has no Message-ID to confirm the archive by');

  Mail.activate();
  Mail.open(message);
  delay(2);
  const window = Mail.windows[0];
  if (String(optional(() => window.name())).indexOf(captured.subject) !== 0) {
    optional(() => window.close());
    throw refuse(archiveUnavailable);
  }
  const item = archiveMenuItem();
  delay(0.5);
  if (!item.enabled()) {
    optional(() => window.close());
    throw refuse(archiveUnavailable);
  }
  item.click();

  for (let attempt = 0; attempt < 20; attempt++) {
    delay(0.5);
    if (source.messages.whose({ messageId: captured.messageId }).id().length === 0) return captured;
  }
  throw refuse('Mail ran its Archive command but the message is still in ' + confirmed);
}
