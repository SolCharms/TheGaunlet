use anchor_lang::prelude::*;

use crate::state::{Crux};
use prog_common::errors::ErrorCode;
use prog_common::{close_account};

#[derive(Accounts)]
#[instruction(bump_treasury: u8)]
pub struct CloseCrux<'info> {

    // Crux and Crux Manager
    #[account(mut, has_one = crux_manager, has_one = crux_treasury)]
    pub crux: Box<Account<'info, Crux>>,
    pub crux_manager: Signer<'info>,

    /// CHECK:
    #[account(mut, seeds = [b"treasury".as_ref(), crux.key().as_ref()], bump = bump_treasury)]
    pub crux_treasury: AccountInfo<'info>,

    /// CHECK:
    #[account(mut)]
    pub receiver: AccountInfo<'info>,

    // misc
    pub system_program: Program<'info, System>,

}

pub fn handler(ctx: Context<CloseCrux>) -> Result<()> {

    let crux_counts = &mut ctx.accounts.crux.crux_counts;

    // Ensure all PDAs associated to crux have already been closed
    if (crux_counts.profile_count > 0) || (crux_counts.challenge_count > 0) || (crux_counts.submission_count > 0) {
        return Err(error!(ErrorCode::NotAllCruxPDAsClosed));
    }

    // Set the receiver of the lamports to be reclaimed from the rent of the accounts to be closed
    let receiver = &mut ctx.accounts.receiver;

    // Close the crux treasury state account
    let treasury_account_info = &mut ctx.accounts.crux_treasury.to_account_info();
    close_account(treasury_account_info, receiver)?;

    // Close the crux state account
    let crux_account_info = &mut (*ctx.accounts.crux).to_account_info();
    close_account(crux_account_info, receiver)?;

    msg!("crux account with pubkey {} now closed", ctx.accounts.crux.key());
    Ok(())
}
