package cli

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"

	"github.com/ChiragAgg5k/mailslot/internal/failure"
	"github.com/ChiragAgg5k/mailslot/internal/mail"
)

const (
	guiName  = "gui"
	archived = "archived"
)

func (app *application) archive() *cobra.Command {
	var (
		mailbox string
		dryRun  bool
		gui     bool
	)
	command := &cobra.Command{
		Use:   "archive <reference>...",
		Short: "Move messages to the account's archive mailbox",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(command *cobra.Command, references []string) error {
			if gui {
				archive := func(ctx context.Context, message mail.Target) (mail.Summary, error) {
					return app.backend.Archive(ctx, message)
				}
				return app.apply(command, references, dryRun, archived, archive, false, nil)
			}
			return app.relocate(command, references, dryRun, app.special(mail.Archive), func(mailbox string) error {
				return failure.New(failure.Usage, fmt.Sprintf("the message is already in %s", mailbox), "")
			})
		},
	}
	mailboxFlag(command, &mailbox)
	dryRunFlag(command, &dryRun)
	command.Flags().BoolVar(&gui, guiName, false, "click Mail's own Archive command, which also archives Gmail; needs Accessibility, an unlocked screen and Mail in front, and takes over the screen while it runs")
	return changing(command)
}
